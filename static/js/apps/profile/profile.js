define([
    'jQuery',
    'Underscore',
    'Backbone',
    'Highcharts'
], function($, _, Backbone, Highcharts) {

$(document).ready(function() {

    var Skill = Backbone.Model.extend({
    
            defaults : function() {
                return {
                    name: "",
                    expertise: 0,
                    experience: 0
                };
            },

            name: function() {
                return this.get("name");
            },

            expertise: function() {
                return this.get("expertise");
            },

            experience: function() {
                return this.get("experience");
            },
    
            setValues: function(expertise, experience) {
                this.set({ expertise: expertise, experience: experience });
            }
    
    });
    
    var SkillCollection = Backbone.Collection.extend({
            model: Skill,
            //localStorage: new Store("skills"),
            selectedIndex: -1,
    
            select: function(id) {
                this.selectedIndex = this.indexOf(this.get(id));
                this.trigger("change:selection");
                return this;
            },
    
            selectNext: function() {
                if(this.selectedIndex < this.length - 1) {
                    this.selectedIndex++;
                } else {
                    this.selectedIndex = -1;
                }
                this.trigger("change:selection");
                return this;
            },
    
            selected: function() {
                return this.at(this.selectedIndex);
            }
    });


    var SkillListView = Backbone.View.extend({
            tagName: "tr",
    
            template: _.template($('#item-template').html()),
    
            skillSet: null,
    
            events : {
                "click" : "select",
            },
    
            initialize: function() {
                this.skillSet = this.options.skillSet;
                this.model.bind("change", this.render, this);
                this.skillSet.bind("change:selection", this.selectionChanged, this);
            },
    
            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                return this;
            },
    
            select: function() {
                this.skillSet.select(this.model.id);
            },

            isSelected: function() {
                var selected = this.skillSet.selected();
                if(selected && selected.id == this.model.id) {
                    return true;
                } else {
                    return false;
                }
            },
    
            selectionChanged: function() {
                if(this.isSelected()) {
                    $(this.el).addClass("ui-selected");
                } else {
                    $(this.el).removeClass("ui-selected");
                }
            }
    });
    
    var SkillChartView = Backbone.View.extend({

            selectionChanged: function() {
            },

            
            initialize: function() {
                this.skillSet = this.options.skillSet;
                this.skillSet.bind("change:selection", this.selectionChanged, this);
                
                var that = this;
                this.chart =  new Highcharts.Chart({
                    chart: {
                        renderTo: 'chart',
                        defaultSeriesType: 'scatter',
                        margin: [70, 50, 60, 80],
                        events: {
                            click: function(e) {
                                var x = e.xAxis[0].value;
                                var y = e.yAxis[0].value;
                                var series = this.series[0];
                                var skill = that.skillSet.selected();
                    
                                if(skill) {
                                    skill.set({"expertise": x.toFixed(1), "experience": y.toFixed(1)});
                                    if(this.get(skill.id)) {
                                       this.get(skill.id).remove();
                                    }
                                    series.addPoint({id: skill.id, name: skill.name(), x: x, y: y});
                                }
                            }
                        }
                    },
                    title: {
                       text: 'Tech Profile'
                    },
                    subtitle: {
                       text: 'Click the plot area to add a point. Click a point to remove it.'
                    },
                    xAxis: {
                       title: {
                          text: 'Expertise'
                       },
                       minPadding: 0.2,
                       maxPadding: 0.2,
                       maxZoom: 0,
                       min: 0,
                       max: 10.1,
                       plotBands: [{
                               from: 0,
                               to: 1,
                               label: {
                                   text: 'Novice'
                               },
                          }, {
                              from: 2,
                              to: 3,
                              label: { 
                                   text: 'Beginner'
                              }
                          }, {
                              from:4 ,
                              to: 6,
                              label: { 
                                   text: 'Intermediate'
                              }
                          }, {
                              from:6 ,
                              to: 8,
                              label: { 
                                   text: 'Proficient'
                              }
                          }, {
                              from:8 ,
                              to: 10,
                              label: { 
                                   text: 'Expert'
                              }
                           }]
                    },
                    yAxis: {
                       title: {
                           text: 'Professional Experience <br> (Years)'
                       },
                       minPadding: 0.2,
                       maxPadding: 0.2,
                       maxZoom: 0,
                       min: 0,
                       max: 15,
                    },
                    legend: {
                       enabled: false
                    },
                    exporting: {
                       enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    tooltip: {
                        formatter: function() {
                            return this.point.name;
                        }
                    },
                    plotOptions: {
                       scatter: {
                          point: {
                             events: {
                                'click': function() {
                                   that.skillSet.select(this.id);
                                   that.skillSet.get(this.id).setValues(0, 0);
                                   this.remove();
                                }
                             }
                          }
                       }
                    },
                    series: [{
                       data: []
                    }]
                });

            },
    
    });

    var ProfileAppView = Backbone.View.extend({

            initialize: function() {

                this.skillSet = new SkillCollection();
                this.skillSet.reset(this.options.data);
                this.skillSet.bind("change", this.changed, this);

                this.chartView = new SkillChartView({skillSet: this.skillSet});

                this.skillSet.each(function(model) { 
                    var listItemView = new SkillListView({model: model, id: model.id, skillSet: this.skillSet});
                    $("#table").append(listItemView.render().el);
                }, this);

                this.skillSet.selectNext();
            },

            changed: function(skill) {
                if(skill.expertise() != 0 && skill.experience() != 0) {
                    this.skillSet.selectNext();
                }
            }

    });

    app = new ProfileAppView({data: window.data});

});
    
});
