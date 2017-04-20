var db=require("./db.js");
var scheduler = require('node-schedule');
var mqtt = require("../utils/mqtt");
var socket= require("./socket");

module.exports={
  add:function(job, node, token){
    scheduler.scheduleJob(job.will_process_at, function(t, n, j){
      db.nodes.get(t, n).then(function(node){
        schedule=node.schedules.find(function(s){
          return s.uuid==j.uuid;
        })
        if(schedule){
          //if schedule still exists, update state!
          db.nodes.updateState(t,n, schedule.state)
          .then((doc)=>{
            console.log("STATE CHANGED!")
            topic=t+"/"+n+"/update"
            console.log("publishing on...", topic)
            mqtt.publish(topic, JSON.stringify(doc.state))
            db.nodes.removeSchedule(t, n, j.uuid).then(function(updated_node){
              console.log("updated node!", updated_node)
              socket.change_node(updated_node, t);
            })
          })
        }
      })
    }.bind(null, token, node, job));
  }
}