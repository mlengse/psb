'use strict';
require('dotenv').config()
const fs = require('fs')
const moment = require('moment')
const excelToJson = require("convert-excel-to-json");
const { upsert } = require("./db");
moment.locale('id')

fs.readdir('./data', (_,e)=> e.map(f => {
  if(f.includes('2019')) {
    fs.readdir(`./data/${f}`, (_, o) => o.map(async file => {
      const result = excelToJson({
        sourceFile: `./data/${f}/${file}`,
        sheets: ["Sheet1"]
      })["Sheet1"];
      let jdl = result.shift()
      
      jdl = jdl.A ? jdl.A : jdl.F
      let jdlArr = jdl.split("  ")
            .join(" ")
            .split(" ")
            .slice(8)
            .join(' ')
            .split('RW')
      let obj = {
        _key: `posy-${jdlArr[1].trim().split(' ').join('-')}`,
        name: jdlArr[0].trim(),
        rw: jdlArr[1].trim()
      };
      await upsert('posyandu', obj)
      let header = result.shift()
      while (!header.A) {
        header = result.shift();
      }
      for(let res of result) if( res.A !== 'No' && res.B /*&& obj.rw === '38'*/) {
        let isDate = res.E instanceof Date && !isNaN(res.E.valueOf())
        let tl
        if(isDate){
          tl = moment(res.E).format('x')
        } else if(res.E) {
          let tl
          ['DD-MM-YYY', '-MM-YYYY'].map(format => {
            let format1 = moment(res.E, format).format('x');
            if(!tl || tl.includes('Invalid')){
              tl = format1
            }
          })
          if( !tl || tl.includes('Invalid')) {
            console.log(file)
            console.log(res.E)
            tl = undefined
          } 
        }
        if(tl && !tl.includes('Invalid')) {
          let a = Object.assign(
            {},
            obj,
            /*res,*/ {
              name: res.B.includes("/")
                ? res.B.replace("/", "alias").toUpperCase()
                : res.B.toUpperCase(),
              jk: res.C == 1 ? "L" : "P",
              gakin: res.D,
              tl: tl,
              ortu: res.F,
              rt: res.G
                ? res.G.toString().includes("/")
                  ? res.G.split("/")[0]
                  : res.G
                : undefined,
              rw: res.G
                ? res.G.toString().includes("/")
                  ? res.G.split("/")[1]
                  : obj.rw
                : obj.rw,
              posy: obj._key,
              _key: `balita-${
                res.B.includes("/")
                  ? res.B.replace("/", "alias")
                      .split(" ")
                      .join("-")
                  : res.B.split(" ")
                      .join("-")
              }${tl ? `-${tl}` : ""}${
                res.C ? `-${res.C == 1 ? "L" : "P"}` : ""
              }`
            } /*, {
              A: undefined,
              B: undefined,
              C: undefined,
              D: undefined,
              F: undefined,
              E: undefined,
              G: undefined
            }*/
          );
          await upsert('balita', a)
          //console.log(JSON.stringify(a))

        }
      }
    }))
    
  } 
}))

const result = excelToJson({
  sourceFile: process.env.FILENAME,
});
result["BB U"].slice(2).map(e => ({
  _key: `bbu-${e.A}`,
  u: e.A,
  lmin3: e.B,
  lmin2: e.C,
  l2: e.D,
  l3: e.E,
  pmin3: e.G,
  pmin2: e.H,
  p2: e.I,
  p3: e.J
})).map(async e => await upsert('bbu', e));

result['KBM'].slice(2).map(e => ({
  _key: `kbm-${e.A}`,
  u: e.A,
  l: e.B,
  p: e.D
})).map(async e => await upsert('kbm', e))

result["BGM"].slice(2).map(e => ({
  _key: `bgm-${e.A}`,
  u: e.A,
  l: e.B,
  p: e.D
})).map(async e => await upsert('bgm', e));
