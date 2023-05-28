const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const uuid = require('uuid');

router.get('/', function(req, res, next) {

     let data = fs.readFileSync("./db/url.json","utf-8");
     let result = JSON.parse(data);
     if(result) data = result;

     res.render('url',{data});
});

router.post('/', function(req, res, next) {

     let {api_name, api_address, request_method} = req.body;

     if(!api_address || !request_method || !api_name) {
          res.send({result: false, msg: 'Data not complete'})
          return;
     }

     try {

          let data = fs.readFileSync("./db/url.json","utf-8");
          let data_parsed = JSON.parse(data);
          let new_data = { id: uuid.v4(), api_name, api_address, request_method }
          data_parsed.push(new_data)
          let finally_data = JSON.stringify(data_parsed);

          fs.writeFileSync('./db/url.json', finally_data, 'utf8');

          data = fs.readFileSync("./db/url.json","utf-8");

          res.send({result: true, data})
     } catch (error) {
          res.send({result: false, msg: error})
     }
     
});

router.post('/delete', function(req, res, next) {

     let {id} = req.body;
     if(!id) {
          res.send({result: false, msg: 'Data not complete'})
          return;
     }

     let data = fs.readFileSync("./db/url.json","utf-8");
     let data_parsed = JSON.parse(data);
     let index = -1;

     for (let i = 0; i < data_parsed.length; i++) {
          if(data_parsed[i]?.id == id){
               index = i;
               break;
          }
     }

     if( index > -1){
          data_parsed.splice(index, 1);
          let finally_data = JSON.stringify(data_parsed);
          fs.writeFileSync('./db/url.json', finally_data, 'utf8');
          let data = fs.readFileSync("./db/url.json","utf-8");

          res.send({result: true, data});
          return;
     }

     res.send({result: false, msg: 'Data not deleted'})
});

module.exports = router;
