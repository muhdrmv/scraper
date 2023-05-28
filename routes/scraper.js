const express = require('express');
const router = express.Router();
const fs = require('fs');
const uuid = require('uuid');
const axios = require('axios');
const connection = require('../db/connection');
const cheerio = require('cheerio')
const timeForDelay1 = 1000; // melliseconed
const timeForDelay2 = 2000; // melliseconed

const insertToDatabase = async (apiData, apiName, requestMethod) => {
     
    if(apiData.length < 1)  return {result: false, msg: 'There is nothing as API data'};
    
    let date = null;
    let invalidDate = null; // This is for t4f.ir invalid date

    if(requestMethod === 'post-method'){
         date = apiData[0]?.Date.split('T');
    }else{

          invalidDate = parseInt(apiData[0]?.Date);

          let t = 1577824200000;
          let d = parseInt(apiData[0]?.Date);
          let newDate = new Date(t + ((d-1)*24*60*60*1000));
          
          const year = newDate.getUTCFullYear();
          const month = newDate.getUTCMonth() + 1; // Months are zero-indexed, so we add 1
          const day = newDate.getUTCDate();
          const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
         
          date = [formattedDate]
    }

    let hasCheckThisDataAgain = connection.query(`SELECT * FROM scapeRoomDateCheck WHERE scapeRoomId = ${apiData[0]?.IdEscapeRoom} AND date = '${date[0]}' AND apiName = '${apiName}' `);
    if(hasCheckThisDataAgain.length > 0) {
         //console.log({result: false, msg: `This api saved in the past (${apiData[0]?.IdEscapeRoom} -> ${date[0]} -> ${apiName} ) `});
         return false; 
    }

    let insertCheckThisDataAgain = connection.query(` INSERT INTO scapeRoomDateCheck (scapeRoomId, apiName, date) VALUES ( ${parseInt(apiData[0]?.IdEscapeRoom)}, '${apiName}', '${date[0]}') `);
    if(insertCheckThisDataAgain?.affectedRows < 1){
         console.log(`ERROR in Inserting database (scapeRoomDateCheck) (${apiData[0]?.IdEscapeRoom} -> ${date[0]} -> ${apiName} ) `);
         return false;
    }



	//console.log('XXXX = ' + apiData[0]?.IdEscapeRoom );
    let hasScapeRoom = connection.query(`SELECT * FROM scapeRoomTables WHERE scapeRoomId = ${apiData[0]?.IdEscapeRoom} AND apiName = '${apiName}' `)
    if(hasScapeRoom?.length == 0){
		 
			let insertData = connection.query(`
				INSERT INTO scapeRoomTables (scapeRoomId, name, apiName) VALUES (${parseInt(apiData[0]?.IdEscapeRoom)}, null, '${apiName}');
			`);
			if(insertData?.affectedRows < 1){
				console.log(`ERROR in Inserting database (scapeRoomTables) (${apiData[0]?.IdEscapeRoom} -> ${apiName} ) `);
			}

			if( requestMethod == "post-method"){
				axios.get(`https://iranescape.com/room/${apiData[0]?.IdEscapeRoom}/`, myConfig2)
				.then(function (response) {
					//console.log(insertData?.insertId);
						const html = response.data;
						const $ = cheerio.load(html);
						let scapeRoom_name = $('div.left h1').text();
						console.log('READ ESCAPE NAME = ' + scapeRoom_name );
						let updateScapeRoom = connection.query(`
							UPDATE scapeRoomTables SET 
							name = '${scapeRoom_name}'
							WHERE scapeRoomId = ${parseInt(apiData[0]?.IdEscapeRoom)} 
						`);
				})
				.catch(function (error) {
						//console.log(error);
					console.log('ERROR GET ESCAPE NAME');
				})
			}else if(insertData?.affectedRows > 0 && requestMethod == "get-method"){
				
				console.time(apiData[0]?.IdEscapeRoom +'  timeout is =');
				
			     await axios.get(`https://www.t4f.ir/fun/${apiData[0]?.IdEscapeRoom}/checkout`)
				.then(function (response) {
						
						const html = response.data;
						const $ = cheerio.load(html);
						//let scapeRoom_name = $('div.whitespace-nowrap h1.Text_h1__1K5Wb').text();
						let scapeRoom_name = $('div.py-3 h5.farsi').text();
						let updateScapeRoom = connection.query(`
							UPDATE scapeRoomTables SET 
							name = '${scapeRoom_name}'
							WHERE scapeRoomId = ${parseInt(apiData[0]?.IdEscapeRoom)}
						`);
				})
				.catch(function (error) {
					console.log(error);
					console.log(apiData[0]?.IdEscapeRoom);
					console.log('T4f.ir ERROR READ ESCAPE NAME');
				})
				console.timeEnd(apiData[0]?.IdEscapeRoom +'  timeout is =');
			}
    }

    if(apiData?.length > 0){
          await apiData.forEach(async a => {

               try {
                    let insertData = connection.query(`
                    INSERT INTO scapeRoom (IdEscapeRoom, price, status, apiName, startTime, date, invalidDate) VALUES ( ${parseInt(a?.IdEscapeRoom)}, '${a?.Price}', '${a?.Status}', '${apiName}', '${a?.TimeStart}','${date[0]}', ${invalidDate});               `);
               if(insertData?.affectedRows < 1){
                    console.log(`ERROR in Inserting database (scapeRoom) (${a?.IdEscapeRoom} ${a?.Price}, ${a?.Status}, ${apiName}, ${a?.TimeStart},${date[0]} , ${invalidDate} ) `);
               }
               } catch (error) {
                    console.log(error);
               }
     });
    }

    return true
}

const handleHTMLResponse = (html, url, apiName, requestMethod) => {

     //handle Date of API 
     const urlParams = new URLSearchParams(url.split('?')[1]);
     const dateId = urlParams.get('date_id');
     const scapeRoom = urlParams.get('fun_id');
     
     const $ = cheerio.load(html);

     const options = [];
     $("select#time option").each((i, el) => {
          const data = $(el).data();
          if(Object.keys(data).length !== 0){
               //console.log(data);
               let obj = {
                    "IdEscapeRoom": parseInt(scapeRoom),
                    "Price": data?.discountPrice,
				"Status": data?.status,
                //    "Status": data?.status == 1 ? 0 : 2 ,
                    "TimeStart": data?.startAt,
                    "Date": dateId
               }
               options.push(obj);
          }
     });

     let response = insertToDatabase(options, apiName, requestMethod);
     return response;
}

const seconedModel = async ({ip_address, parameters, results, request_method}) => {

     let apis = [];
     let cleaned_p1 = parameters[0].replace(/\$/g, '');
     let cleaned_p2 = parameters[1].replace(/\$/g, '');
     const p1 = results.find(result => result.parameter === cleaned_p1);
     const p2 = results.find(result => result.parameter === cleaned_p2);

     const regex_p1 = new RegExp(parameters[0].replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
     const regex_p2 = new RegExp(parameters[1].replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
	
     if(request_method == "get-method"){

		let CheckThisDataAgain = [817,819,821,822,823,824,825,826,827,828,829,830,831,832,833,834,835,837,838,839,840,841,842,843,844,846,847,848,850,855,871,872,873,874,875,876,877,883,885,886,887,891,892,893,894,896,897,898,899,900,901,903,904,905,909,910,911,913,914,916,920,922,923,924,925];
		//	let CheckThisDataAgain = [33,37,116,144,179,180,181,196,197,211,224,240,251,266,273,275,279,280,281,285,289,298,315,319,320,324,325,326,330,332,340,344,345,346,347,354,355,357,359,361,364,377,378,379,382,391,398,400,411,413,418,422,423,426,427,428,429,431,434,441,444,445,447,448,449,460,463,467,470,471,473,477,478,486,488,489,493,496,499,500,504,505,506,508,513,518,519,520,526,527,528,529,530,533,534,535,537,543,545,546,547,549,551,554,556,558,559,563,564,566,575,576,579,580,581,584,585,586,588,611,612,614,615,616,618,622,623,624,660,663,664,666,667,668,672,674,675,676,677,679,680,689,691,699,700,701,702,704,706,708,712,713,714,715,717,718,719,722,723,724,726,727,729,732,735,737,740,743,744,745,747,749,751,752,753,754,755,756,757,758,759,761,787,788,791,793,794,795,796,798,800,801,803,804,805,806,808,809,812,814,815,816,817,819,821,822,823,824,825,826,827,828,829,830,831,832,833,834,835,837,838,839,840,841,842,843,844,846,847,848,850,855,871,872,873,874,875,876,877,883,885,886,887,891,892,893,894,896,897,898,899,900,901,903,904,905,909,910,911,913,914,916,920,922,923,924,925];
			
          //for (let i = p1.min; i <= p1.max; i++) {
		for (let i in CheckThisDataAgain ) {

               let isRedirecting = false;
               await axios.head(`https://www.t4f.ir/fun/${CheckThisDataAgain[i]}/checkout?by=web`)
               .then(response => {
                    if(response?.request?._redirectable?._redirectCount > 0){
                         console.log(`https://www.t4f.ir/fun/${CheckThisDataAgain[i]}/checkout?by=web : ${CheckThisDataAgain[i]}  is 301`);
                         isRedirecting = true;
                    }
               })
               .catch(error => {
                    console.log(`https://www.t4f.ir/fun/${CheckThisDataAgain[i]}/checkout?by=web : ${CheckThisDataAgain[i]}  error ${error?.request?.res?.statusCode}`);
               
                    if(error?.request?.res?.statusCode == 404){
                         isRedirecting = true;
                    }else if(error?.config?.timeout == 2000 ){
                         //console.log(error);
                         isRedirecting = true;
                         console.log(`https://www.t4f.ir/fun/${CheckThisDataAgain[i]}/checkout?by=web : ${CheckThisDataAgain[i]}  timeout`);
                    }else{
                         console.log(error);
                    }
               });
     
               if(!isRedirecting){
				    console.log(`https://www.t4f.ir/fun/${CheckThisDataAgain[i]}/checkout?by=web : ${CheckThisDataAgain[i]}  is 200 okkkkkkkkk`);
                    for (let k = p2.min; k <= p2.max; k++) {
               
                         let api = ip_address.replace(regex_p1, CheckThisDataAgain[i].toString());
                         api = api.replace(regex_p2, k.toString());
                         apis.push(api);
                    }
               }
          }
     }else{

          for (let i = p1.min; i <= p1.max; i++) {
               for (let k = p2.min; k <= p2.max; k++) {
          
                    let api = ip_address.replace(regex_p1, i.toString());
                    api = api.replace(regex_p2, k.toString());
                    apis.push(api);
               }
          }
          
     }
     
     console.log(apis);
     return apis;
}

const sendPostRequest = async (apis, api_name, requestMethod) => {
     
     return new Promise((resolve, reject) => {
          const postPromises = [];
          let unhandledAPIs = [];

          apis.forEach(api => {
               postPromises.push(
                    axios.post(`${api}`, myConfig2)
                    .then(async function (response) {
                         await insertToDatabase(response.data, api_name, requestMethod);
						console.log('insert = ' + api);
                    })
                    .catch(function (error) {
                         unhandledAPIs.push(api)
                         console.log('Error in sending Request or APIs => PUSH TO unhandledAPIs => 01 API = ' + api);
                    })
               );
          });

          Promise.all(postPromises)
          .then(function (results) {
			   console.log('START READ From unhandledAPIs 01');
               unhandledAPIs.forEach(api => {
				   console.log('READ unhandledAPIs 01 API = ' + api);
                    axios.post(`${api}`, myConfig2)
                    .then(async function (response) {
                         await insertToDatabase(response.data, api_name, requestMethod);
						 console.log('insert Sucsses From unhandledAPIs 01 = ' + api);
                    })
                    .catch(function (error) {
                         console.log('Error in sending Request or APIs => 02 API = ' + api);
                    })
               });
               resolve({ 
                    result: true,
                    msg: "END INSERT 02 unhandledAPIs",
			   });
			   console.log('END INSERT 02 unhandledAPIs '+ ' all api insert');
          })
          .catch(function (errors) {
               console.log(errors);
			   console.log('Error 03 unhandledAPIs');
               reject({
                    result: false,
                    msg: "Error in sending Request or the APIs has problem!",
               });
          });
     });
};  

const sendGetRequest = async (apis, apiName, requestMethod) => {

     return new Promise(async (resolve, reject) => {
          const getPromises = [];
          let unhandledAPIs = [];
        
          console.log('Into Send GET');
        
          for (const [index, api] of apis.entries()) {

               await new Promise(resolve => setTimeout(resolve, 1000 )); // Delay based on the index
          
               getPromises.push(
                    axios
                    .get(`${api}`)
                    .then( async function (response) {
                         if (response.data?.html) {
                              console.log(index+ " : " + api);
                              await handleHTMLResponse(response.data?.html, api, apiName, requestMethod);
                         }
                    })
                    .catch(function (error) {
                         unhandledAPIs.push(api);
                         console.log(error);
                         console.log('Error in sending Request or APIs => PUSH TO unhandledAPIs => 02 API = ' + api);
                    })
               );
          }
        
          Promise.all(getPromises)
          .then(function (results) {
               console.log('START READ From unhandledAPIs 02');
               unhandledAPIs.forEach(api => {
                    axios
                    .get(`${api}`)
                    .then(async function (response) {
                         await handleHTMLResponse(response.data?.html, api, apiName, requestMethod);
                         console.log('insert Success From unhandledAPIs 02 = ' + api);
                    })
                    .catch(function (error) {
                         console.log('Error in sending Request or the APIs has a problem! 03 API = ' + api);
                         // console.log('429 error');
                    });
               });
          
               resolve({ result: true, msg: "END INSERT 02 unhandledAPIs" });
               console.log('END INSERT 02 unhandledAPIs ' + ' all API insert');
          })
          .catch(function (errors) {
               console.log(errors);
               console.log('Error 04 unhandledAPIs');
               reject({ result: false, msg: "Error in sending Request or the APIs 04 has a problem!" });
          });
     });
}

router.get('/', function(req, res, next) {

     let data = fs.readFileSync("./db/url.json","utf-8");
     let result = JSON.parse(data);
     if(result) data = result;

     res.render('scraper',{data});
});

router.post('/generate', async function(req, res, next) {

     console.log('Request Started');
     let {scraper_data} = req.body;
     let results = []
     if((scraper_data?.results[0]?.min == 0 && scraper_data?.results[0]?.max == 0) || (scraper_data?.results[1]?.min == 0 && scraper_data?.results[1]?.max == 0)){
          res.send({result: false, msg: 'The parameter should not be Zero '});
          return;
     }

     if(scraper_data?.parameters.length == 2){
          results = await seconedModel(scraper_data);
     }

     if(scraper_data?.request_method.includes("post")){

          if(results.length < 1){
               res.send({result: false, msg: 'The Scraper Could not create APIs'});
               return;
          }
          
          try {
               let requestSending = await sendPostRequest(results, scraper_data?.api_name, scraper_data?.request_method );

               if(!requestSending?.result){
                    res.send({result: false, msg: requestSending?.msg});
                    return;
               }
          } catch (error) {
               console.log(error);
          }


          res.send({result: true});
          return;
     }

     if(scraper_data?.request_method.includes("get")){

          if(results.length < 1){
               res.send({result: false, msg: 'The Scraper Could not create APIs'});
               return;
          }

          try {
               let requestSending = await sendGetRequest(results, scraper_data.api_name, scraper_data?.request_method );
			   
               if(!requestSending?.result){
                    res.send({result: false, msg: requestSending?.msg});
                    return;
               }
          } catch (error) {
               console.log(error);
          }
          

          res.send({result: true});
          return;
     }

});

module.exports = router;
