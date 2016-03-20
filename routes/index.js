var moment = require("moment");
var es = require("elasticsearch");
var csv = require("fast-csv");
var _ = require("lodash");
var freq = _.groupBy(require("../Frequency.json"),'pid');
var client = es.Client({
  host: "192.168.0.19:9200"
});
var bllist=[],linklist=[];
csv.fromPath('Allword.csv')
  .on('data', function(data){
    bllist.push(data[1]);
  })
csv.fromPath('Patent_link.csv')
  .on('data', function(data){
    linklist.push(data[1]);
  })
module.exports = function(app){
  app.get('/get_stat', function(req, res){
    var q = req.query.q;
    var re = /(\s|\.|\n)+$/i;
    if(!q)return res.json([]);
    var terms = q;
    client.search({q: terms}, function(err, resp){
      if(err){console.log(err);return res.status(500).json({error: "Error occured"})}
      var hits = resp.hits.hits;
      var stat = [];
      _.each(hits, function(hit){
        var date_obj = moment(hit._source.priorityDate,"MMM DD, YYYY");
        //var des_terms = _.compact(hit._source.description.replace(re," ").split(" "));
        stat.push({
          year:date_obj.year(),
          doc: hit
        });
      });
      var yearGroup = _.groupBy(stat, 'year');
      console.log(yearGroup)
      return res.json(hits)
    });
  })
  app.get('/get_data', function(req, res){
    var q = req.query.q;
    if(!q)return res.json([]);
    var terms = q;
    client.search({q: terms}, function(err, resp){
      if(err){console.log(err);return res.status(500).json({error: "Error occured"});}
      var hits = resp.hits.hits;
      terms = [], l =[];
      _.each(hits, function(hit){
        var id = parseInt(hit._id) + 428;
        if(freq[id]){
          terms = _.map(_.reject(terms.concat(freq[id]),function(term){return q.split(",").indexOf(term.word) != -1;}),function(t){t.frequency=t.frequency+hit.score;return t;});
	  l.push({link:linklist[id],name:hit._source.name});
	}
        
      });
      terms.sort(function(a,b){
        return b.frequency - a.frequency;
      });
      terms.splice(7);
      data = _.map(terms,function(row){
        return {
          term: row.word,
          score: row.frequency * 1000,
	  link:l 
        };
      })
      res.set('Access-Control-Allow-Origin','*')
      return res.json(data);
    })
  })
}
