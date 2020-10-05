// ==UserScript==
// @name         WaniKani Dashboard Level Progress Detail
// @version      1.0.3
// @description  Show detailed progress bars.
// @author       UInt2048
// @include      /^https://(www|preview).wanikani.com/(dashboard)?$/
// @run-at       document-end
// @grant        none
// @namespace https://greasyfork.org/users/149329
// @downloadURL none
// ==/UserScript==

(function() {
  'use strict';

  if (!window.wkof) {
    alert('WK Dashboard Level Progress Detail requires Wanikani Open Framework.\nYou will now be forwarded to installation instructions.');
    window.location.href = 'https://community.wanikani.com/t/instructions-installing-wanikani-open-framework/28549';
    return;
  }
  window.wkof.include('ItemData, Apiv2, Menu, Settings');

  var locked_data_url = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEX////p6emlmyooAAAAAnRSTlMAgJsrThgAAAA1SURBVDjLY3huea54DpQ4wIBgnyuewDAHSdKAAUnhuQIGJIVzHjCMmjJqyqgpo6aMmkKkKQC2XQWeSEU1BQAAAABJRU5ErkJggg==')";

  function render(json) {
    const settings = window.wkof.settings.level_progress_detail;
    const usePassed = settings.progress_hidden % 2 == 0;
    const percentageRequired = settings.progress_hidden < 3 ? 90 : 100;

    window.$(".progress-component").children().slice(0, -2).remove();
    if (settings.hide_current_level) { window.$(".progress-component").empty(); }

    var progresses = [];
    while (json.progresses.length > settings.unconditional_progressions) {
      var progress = json.progresses[0];
      var total_learned = progress.srs_level_totals.slice(1, 10).reduce((a, b) => a + b, 0); // 0 of the srs_level_totals is unlearned, so it's sliced out

      var learnedRequired = settings.require_learned ? progress.max : 0;
      var percentageTotal = usePassed ? progress.passed_total : progress.gurued_total;

      if ((percentageTotal * 100.0 / progress.max >= percentageRequired && total_learned >= learnedRequired) || progress.max === 0) {
        // Skip over it
      } else {
        progresses.push(progress);
      }
      json.progresses = json.progresses.slice(1);
    }

    json.progresses = progresses.concat(json.progresses);

    const guruOpacity = 0.5;
    const guruGradient = "linear-gradient(to bottom, #a0f, #9300dd)";
    const initialApprenticeOpacity = 0.5;
    const apprenticeOpacityChange = 0.7;
    const apprenticeGradient = "linear-gradient(to bottom, #f0a, #dd0093)";

    var stageNames = ['', 'Apprentice I', 'Apprentice II', 'Apprentice III', 'Apprentice IV'];
    var runningHTML = "";
    json.progresses.forEach(function(progress, j) {
      var html =
        '<div id="progress-' + progress.level + '-' + progress.type + '" class="vocab-progress">' +
        '  <h3>Level ' + progress.level + ' ' + progress.type.charAt(0).toUpperCase() + progress.type.slice(1) + ' Progression</h3>' +
        '<div class="chart" style="position:relative;">' +
        (progress.max < 10 ? "" :
          '<div class="threshold" style="width: ' + Math.ceil(progress.max * 0.9) * 100 / progress.max + '% !important;height:100% !important;position:absolute !important;padding-right:0.5em !important;color:#a6a6a6 !important;font-family:Helvetica, Arial, sans-serif;text-align:right;border-right:1px solid rgba(0,0,0,0.1);-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-box-shadow:1px 0 0 #eee;-moz-box-shadow:1px 0 0 #eee;box-shadow:1px 0 0 #eee;text-shadow:0 1px 0 rgba(255,255,255,0.5)"><div style="position:absolute;bottom:0;right:0;">' +
          Math.ceil(progress.max * 0.9) +
          '&nbsp</div></div>') + // 90% marker
        (progress.max < 2 || !settings.show_halfway_marker ? "" :
          '<div class="threshold" style="width: ' + Math.ceil(progress.max * 0.5) * 100 / progress.max + '% !important;height:100% !important;position:absolute !important;padding-right:0.5em !important;color:#a6a6a6 !important;font-family:Helvetica, Arial, sans-serif;text-align:right;border-right:1px solid rgba(0,0,0,0.1);-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-box-shadow:1px 0 0 #eee;-moz-box-shadow:1px 0 0 #eee;box-shadow:1px 0 0 #eee;text-shadow:0 1px 0 rgba(255,255,255,0.5)"><div style="position:absolute;bottom:0;right:0;">' +
          Math.ceil(progress.max * 0.5) +
          '&nbsp</div></div>') + // 50% marker

        '    <div class="progress" title="Unstarted (' + progress.srs_level_totals[0] + '/' + progress.max + ')" style="border-radius:' + settings.border_radius + 'px !important;">' +
        '      <div class="bar" title="Guru+ (' + progress.gurued_total + '/' + progress.max + ')"  style="float: left !important; opacity: ' + 100 * guruOpacity + '% !important; background-color: #a100f1 !important; background-image: ' + guruGradient + ' !important; width: ' + (progress.gurued_total * 100.0 / progress.max) + '% !important; height: 100% !important; margin:0px !important; border-radius:' + settings.border_radius + 'px !important;">' +
        '        <span class="dark" style="display: none;">&nbsp;</span>' +
        '      </div>';

      var opacity = initialApprenticeOpacity;
      for (var i = 4; i >= 1; i--) {
        var percentage = progress.srs_level_totals[i] * 100.0 / progress.max;
        html +=
          '      <div class="bar bar-supplemental"  title="' + stageNames[i] + ' (' + progress.srs_level_totals[i] + '/' + progress.max + ')" style="float: left !important; opacity: ' + opacity + ' !important; background-color: #a100f1 !important; background-image: ' + apprenticeGradient + ' !important; width: ' + (percentage) + '% !important; height: 100% !important; margin:0px !important; border-radius:' + settings.border_radius + 'px !important;">' +
          '        <span class="dark" style="display: none;"></span>' +
          '      </div>';

        opacity *= apprenticeOpacityChange;
      }

      var unlockedCount = 0;
      progress.srs_level_totals.forEach(function(srs_level_total) {
        unlockedCount += srs_level_total;
      });
      var lockedCount = progress.max - unlockedCount;
      var notStartedWidth = progress.srs_level_totals[0] * 100.0 / progress.max;
      var lockedWidth = lockedCount * 100.0 / progress.max;

      html +=
        '      <div class="bar bar-supplemental" title="Locked (' + lockedCount + '/' + progress.max + ')" style="float:left !important; background-color: #a8a8a8 !important; background-image: ' + locked_data_url + ' !important; width: ' + lockedWidth + '% !important; height: 100% !important; margin:0px !important; margin-left: ' + notStartedWidth + '% !important; border-radius:' + settings.border_radius + 'px !important;">' +
        '        <span class="dark" style="display: none;"></span>' +
        '      </div>';

      var total = progress.gurued_total == progress.max ? 0 : progress.gurued_total;
      html +=
        '    </div>' + total + '<span class="pull-right total">' + progress.max + '</span>' +
        '  </div>' +
        '</div>';

      if (j != json.progresses.length - 1) {
        //html += '<hr class="custom-splitter"/>';
      }

      runningHTML += html;
    });
    window.$('.progress-component').prepend(runningHTML);
  }

  function prepareForRender() {
  var cached_json = localStorage.getItem('level-progress-cache');
  var didRender = false;
  if (cached_json) {
    render(JSON.parse(cached_json));
    didRender = true;
  }

  window.wkof.ready('ItemData, Apiv2').then(() => {
    window.wkof.Apiv2.get_endpoint('level_progressions').then(levels => {
      var level_list = [];
      for (var id in levels) {
        level_list.push(levels[id]);
      }
      var top_level = level_list.find(l => l.data.abandoned_at == null && l.data.passed_at == null && l.data.unlocked_at != null).data.level;
      window.wkof.ItemData.get_items('assignments').then(items => {
        var collection = [];
        items.forEach(item => {
          prog = collection.find(p => p.level == item.data.level && p.type == item.object);
          if (prog == undefined) {
            var prog = {
              level: item.data.level,
              type: item.object,
              srs_level_totals: Array(10).fill(0),
              gurued_total: 0,
              passed_total: 0,
              max: 0
            };
            collection.push(prog);
          }
          if (item.assignments != undefined && item.assignments.unlocked_at != null) {
            prog.srs_level_totals[item.assignments.srs_stage]++;
            if (item.assignments.srs_stage >= 5) {
              prog.gurued_total++;
            }
            if (item.assignments.passed_at != null) {
              prog.passed_total++;
            }
          }
          prog.max++;
        });
        collection = collection.filter(p => {
          return p.level <= top_level //p.level == top_level || ( p.srs_level_totals[0] != p.max && p.gurued_total != p.max && p.level <= top_level );
        }).sort((a, b) => {
          var order = ['radical', 'kanji', 'vocabulary'];
          return a.level - b.level + (order.indexOf(a.type) - order.indexOf(b.type)) / 10;
        });
        var json = {
          progresses: collection
        };
        localStorage.setItem('level-progress-cache', JSON.stringify(json));
        if (cached_json != json) { render(json); }
      }); // assignments
    }); // level progressions
  }); // Item Data, APIv2
  }

  window.wkof.ready('Menu,Settings').then(load_settings).then(install_menu).then(prepareForRender);

  // Load settings and set defaults
    function load_settings() {
        var defaults = {
            progress_hidden: '2',
            unconditional_progressions: 3,
            border_radius: 10,
            hide_current_level: false,
            require_learned: true,
            show_halfway_marker: true,
        };
        return window.wkof.Settings.load('level_progress_detail', defaults);
    }

    // Installs the options button in the menu
    function install_menu() {
        var config = {
            name: 'level_progress_detail_settings',
            submenu: 'Settings',
            title: 'Dashboard Level Progress Detail',
            on_click: open_settings
        };
        window.wkof.Menu.insert_script_link(config);
    }

    // Create the options
    function open_settings(items) {
        var config = {
            script_id: 'level_progress_detail',
                title: 'Dashboard Level Progress Detail',
                content: {
                    progress_hidden: {
                        type: 'dropdown',
                        label: 'Progress hidden criteria',
                        hover_tip: 'Choose criteria for what progress to hide',
                        default: '2',
                        content: {
                            1: '90+% guru or higher right now',
                            2: '90+% passed (has been guru or higher at any point)',
                            3: '100% guru or higher right now',
                            4: '100% passed (has been guru or higher at any point)'
                        }
                    },
                    unconditional_progressions: {
                        type: 'number',
                        label: 'Progressions shown unconditionally',
			            hover_tip: 'For example, 3 will always show current level radical, kanji, and vocab progressions',
                        min: 0,
			            default: 3
			        },
                    border_radius: {
                        type: 'number',
                        label: 'Roundedness of progression (in pixels)',
			            hover_tip: 'Choose zero for no roundedness, and 10 for maximum roundedness.',
                        min: 0,
			            default: 10
			        },
                    hide_current_level: {
                        type: 'checkbox',
                        label: 'Hide current level items',
			            hover_tip: 'Check this box to hide the list of radicals and kanji.',
			            default: false
			        },
                    require_learned: {
                        type: 'checkbox',
                        label: 'Require all items to be learned to hide',
			            hover_tip: 'Check this box to require every item to have completed its lesson in a category before hiding it.',
			            default: true
			        },
                    show_halfway_marker: {
                        type: 'checkbox',
                        label: 'Show halfway marker',
			            hover_tip: 'Show 50% marker in addition to 90% marker.',
			            default: true
			        },
                }
        }
        var dialog = new window.wkof.Settings(config);
        dialog.open();
    }
})();