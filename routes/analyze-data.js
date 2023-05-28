const express = require('express');
const router = express.Router();
const fs = require('fs');
const connection = require('../db/connection');
const ExcelJS = require('exceljs');
const uuid = require('uuid');

router.get('/', function(req, res, next) {

     let all_data = connection.query(`
          SELECT scapeRoom.*, scapeRoomTables.name,
               CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
          FROM scapeRoom 
          INNER JOIN scapeRoomTables
          ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
          LEFT JOIN t4ftime
          ON scapeRoom.invalidDate=t4ftime.dateInT4f
          ORDER BY IdEscapeRoom, date ASC
     `);
     let scapeRooms = connection.query(`
          SELECT * FROM scapeRoomTables 
          ORDER BY scapeRoomId ASC
     `);

     let soldScapeRoom = connection.query(`
          SELECT * FROM scapeRoom 
          WHERE status = 2 OR status = 1
     `);

     let data = fs.readFileSync("./db/url.json","utf-8");
     let result = JSON.parse(data);
     if(result) data = result;

     res.render('analyze-data',{results: all_data, scapeRooms, apis: data, soldScapeRoom: soldScapeRoom.length });
});

router.post('/', async function(req, res, next) {

     let {customize_data} = req.body;

     if(customize_data?.date != 'all'){

          if(customize_data?.scapeRoom != 0){

               if(customize_data?.APIName == 'all'){
                    
                    let data = connection.query(`
                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         WHERE scapeRoom.date = '${customize_data?.date}' AND 
                         scapeRoom.IdEscapeRoom = ${customize_data?.scapeRoom} 
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);

                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE (status = 2 OR status = 1) AND 
                         date = '${customize_data?.date}' AND 
                         IdEscapeRoom = ${customize_data?.scapeRoom} 
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }else{
                         
                    let data = connection.query(`

                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         WHERE scapeRoom.date = '${customize_data?.date}' AND 
                         scapeRoom.IdEscapeRoom = ${customize_data?.scapeRoom} AND
                         scapeRoom.apiName = '${customize_data?.APIName}'
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);

                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE (status = 2 OR status = 1) AND 
                         date = '${customize_data?.date}' AND 
                         IdEscapeRoom = ${customize_data?.scapeRoom} AND
                         apiName = '${customize_data?.APIName}'
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }
               
          }else{

               if(customize_data?.APIName == 'all'){

                    let data = connection.query(`
                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         WHERE scapeRoom.date = '${customize_data?.date}' 
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);

                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE (status = 2 OR status = 1) AND 
                         date = '${customize_data?.date}' 
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }else{

                    let data = connection.query(`
                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         WHERE scapeRoom.date = '${customize_data?.date}' AND
                         scapeRoom.apiName = '${customize_data?.APIName}'
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);

                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE (status = 2 OR status = 1) AND 
                         date = '${customize_data?.date}' AND
                         apiName = '${customize_data?.APIName}'
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }
               
          }
    }else{

          if(customize_data?.scapeRoom != 0){

               if(customize_data?.APIName == 'all'){

                    let data = connection.query(`
                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         WHERE scapeRoom.IdEscapeRoom = ${customize_data?.scapeRoom} 
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);

                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE (status = 2 OR status = 1) AND 
                         IdEscapeRoom = ${customize_data?.scapeRoom} 
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }else{

                    let data = connection.query(`
                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         WHERE scapeRoom.IdEscapeRoom = ${customize_data?.scapeRoom} AND
                         scapeRoom.apiName = '${customize_data?.APIName}'
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);

                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE (status = 2 OR status = 1) AND 
                         IdEscapeRoom = ${customize_data?.scapeRoom} AND
                         apiName = '${customize_data?.APIName}'
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }
          }else{
               if(customize_data?.APIName == 'all'){

                    let data = connection.query(`
                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);

                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE status = 2 OR status = 1
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }else{

                    let data = connection.query(`

                         SELECT scapeRoom.*, scapeRoomTables.name,
                              CASE WHEN t4ftime.dateInPersian IS NOT NULL THEN t4ftime.dateInPersian END AS dateInPersian
                         FROM scapeRoom 
                         INNER JOIN scapeRoomTables
                         ON scapeRoom.IdEscapeRoom=scapeRoomTables.scapeRoomId
                         LEFT JOIN t4ftime
                         ON scapeRoom.invalidDate=t4ftime.dateInT4f
                         WHERE scapeRoom.apiName = '${customize_data?.APIName}'
                         ORDER BY scapeRoom.IdEscapeRoom, scapeRoom.date ASC
                    `);
                    let soldScapeRoom = connection.query(`
                         SELECT * FROM scapeRoom 
                         WHERE (status = 2 OR status = 1) AND 
                         apiName = '${customize_data?.APIName}'
                    `);

                    res.send({result: true, data, soldScapeRoom: soldScapeRoom.length});
                    return;
               }
          }
    }

}); 

router.get('/download/:filename', function(req, res, next){
     res.download(`./public/download/${req.params.filename}.xlsx`);
});

router.post('/create-excel-file', function(req, res, next) {

     let {dataAnalyze} = req.body;
     let data = JSON.parse(dataAnalyze)
     if(data.length < 1){
          res.send({result: false, msg: 'there is nothing to create excel file'});
          return;
     }

     const workbook = new ExcelJS.Workbook();
     const worksheet = workbook.addWorksheet('Sheet 1');
     
     // Add headers to the worksheet
     const headers = Object.keys(data[0]);
     worksheet.addRow(headers);
     
     // Add data to the worksheet
     data.forEach((item) => {
       const rowValues = Object.values(item);
       worksheet.addRow(rowValues);
     });
     
     // Set the content type and disposition of the response
     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
     res.setHeader('Content-Disposition', 'attachment; filename=' + 'escape-room-experiences.xlsx');
     
     // Write the workbook to the response
     let filename = uuid.v4();
     workbook.xlsx.writeFile(`./public/download/${filename}.xlsx`)
     .then(() => {
       res.status(200).json({ filename });
     })
     .catch((error) => {
       console.log(error);
       res.status(500).json({ message: 'Failed to create Excel file.' });
     });
     
});

module.exports = router;
