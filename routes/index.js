var moment = require("moment");
var es = require("elasticsearch");
var csv = require("fast-csv");
var _ = require("lodash");
var freq = _.groupBy(require("../Frequency.json"),'pid');
var client = es.Client({
  host: "192.168.0.19:9200"
});
var bllist;
csv.fromPath('Allword.csv')
  .on('data', function(data){
    bllist = _.map(data,function(row){return row[1];});
  })

module.exports = function(app){
  app.get('/get_stat', function(req, res){
    var q = req.query.q;
    if(!q)return res.json([]);
    var terms = q;
    client.search({q: terms}, function(err, resp){
      if(err){console.log(err);return res.status(500).json({error: "Error occured"})}
      var hits = resp.hits.hits;
      var stat = [];
      _.each(hits, function(hit){
        state.push({

        })
      });
     return res.json(stat)
    });
  })
  app.get('/get_data', function(req, res){
    var q = req.query.q;
    if(!q)return res.json([]);
    var terms = q;
    client.search({q: terms}, function(err, resp){
      if(err){console.log(err);return res.status(500).json({error: "Error occured"});}
      var hits = resp.hits.hits;
      terms = [];
      _.each(hits, function(hit){
        var id = parseInt(hit._id) + 428;
        if(freq[id]){
          terms = terms.concat(freq[id]);
	}
      });
      terms.sort(function(a,b){
        return b.frequency - a.frequency;
      });
      terms.splice(8);
      data = _.map(terms,function(row){
        return {
          term: row.word,
          score: row.frequency * 1000
        };
      })
      res.set('Access-Control-Allow-Origin','*')
      return res.json(data);
    })
  })
}
