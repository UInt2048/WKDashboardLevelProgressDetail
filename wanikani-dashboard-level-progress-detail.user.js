// ==UserScript==
// @name         WaniKani Dashboard Level Progress Detail
// @version      1.1.2
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

        const burnedOpacity = 1;
        const enlightenedOpacity = 1;
        const masterOpacity = 0.9;
        const initialGuruOpacity = 1;
        const guruOpacityChange = settings.opacity_multiplier_guru;
        const initialApprenticeOpacity = 1;
        const apprenticeOpacityChange = settings.opacity_multiplier_apprentice;

        const burnStage = 9;
        const enlightenedStage = 8;
        const masterStage = 7;
        const guruStage = 5;
        const apprenticeStage = 1;
        const stageNames = ['', 'Apprentice I', 'Apprentice II', 'Apprentice III', 'Apprentice IV', 'Guru I', 'Guru II', 'Master', 'Enlightened', 'Burned'];

        function getColorCode(stage) {
            if (stage >= burnStage) return settings.colorcode_burned;
            else if (stage >= enlightenedStage) return settings.colorcode_enlightened;
            else if (stage >= masterStage) return settings.colorcode_master;
            else if (stage >= guruStage) return settings.colorcode_guru;
            else if (stage >= apprenticeStage) return settings.colorcode_apprentice;
        }

        function totalAtLeast(progress, stage) {
            return progress.srs_level_totals.slice(stage).reduce((a, b) => a + b, 0);
        }

        window.$(".progress-component").children().slice(0, -2).remove();
        if (settings.hide_current_level) { window.$(".progress-component").empty(); }

        var progresses = [];
        while (json.progresses.length > settings.unconditional_progressions) {
            var progress = json.progresses[0];
            var total_learned = totalAtLeast(progress, apprenticeStage);
            var gurued_plus_total = totalAtLeast(progress, guruStage);

            var learnedRequired = settings.require_learned ? progress.max : 0;
            var percentageTotal = usePassed ? progress.passed_total : gurued_plus_total;

            if (!(percentageTotal * 100.0 / progress.max >= percentageRequired && total_learned >= learnedRequired) && progress.max !== 0) {
                progresses.push(progress);
            }
            json.progresses = json.progresses.slice(1);
        }

        json.progresses = progresses.concat(json.progresses);

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
                 '&nbsp</div></div>'); // 50% marker

            let opacity = settings.distinguish_beyond_guru ? burnedOpacity : initialGuruOpacity;
            let gurued_plus_total = totalAtLeast(progress, guruStage);

            html += '    <div class="progress" title="Unstarted (' + progress.srs_level_totals[0] + '/' + progress.max + ')" style="border-radius:' + settings.border_radius + 'px !important;">';
            for (let i = settings.distinguish_beyond_guru ? stageNames.length - 1 : guruStage; i >= apprenticeStage; i--) {
                let name = (!settings.distinguish_beyond_guru && i == guruStage) ? "Guru+" : stageNames[i];
                let total = (!settings.distinguish_beyond_guru && i == guruStage) ? gurued_plus_total : progress.srs_level_totals[i];
                let percentage = total * 100.0 / progress.max;
                let gradient = "linear-gradient(to bottom, " + getColorCode(i) + ", #222)";

                html +=
                    '      <div class="bar bar-supplemental"  title="' + name + ' (' + total + '/' + progress.max + ')" style="float: left !important; opacity: ' + opacity + ' !important; background-color: #a100f1 !important; background-image: ' + gradient + ' !important; width: ' + (percentage) + '% !important; height: 100% !important; margin:0px !important; border-radius:' + settings.border_radius + 'px !important;">' +
                    '        <span class="dark" style="display: none;"></span>' +
                    '      </div>';

                if (i == burnStage) opacity = enlightenedOpacity;
                else if (i == enlightenedStage) opacity = masterOpacity;
                else if (i == masterStage) opacity = initialGuruOpacity;
                else if (i > guruStage) opacity *= guruOpacityChange;
                else if (i == guruStage) opacity = initialApprenticeOpacity;
                else opacity *= apprenticeOpacityChange;
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

            var total = gurued_plus_total == progress.max ? 0 : gurued_plus_total;
            html +=
                '    </div>' + total + '<span class="pull-right total">' + progress.max + '</span>' +
                '  </div>' +
                '</div>';

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
                var top_level = (level_list.find(l => l.data.abandoned_at == null && l.data.passed_at == null && l.data.unlocked_at != null) || level_list.slice(-1)[0]).data.level;
                window.wkof.ItemData.get_items('assignments').then(items => {
                    var collection = [];
                    items.forEach(item => {
                        prog = collection.find(p => p.level == item.data.level && p.type == item.object);
                        if (prog == undefined) {
                            var prog = {
                                level: item.data.level,
                                type: item.object,
                                srs_level_totals: Array(10).fill(0),
                                passed_total: 0,
                                max: 0
                            };
                            collection.push(prog);
                        }
                        if (item.assignments != undefined && item.assignments.unlocked_at != null) {
                            prog.srs_level_totals[item.assignments.srs_stage]++;
                            if (item.assignments.passed_at != null) {
                                prog.passed_total++;
                            }
                        }
                        prog.max++;
                    });
                    collection = collection.filter(p => {
                        return p.level <= top_level
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
            progress_hidden: '3',
            unconditional_progressions: 0,
            border_radius: 10,
            hide_current_level: true,
            require_learned: true,
            show_halfway_marker: true,
            distinguish_beyond_guru: false,
            colorcode_apprentice: '#1cdc9a',
            colorcode_guru: '#2ecc71',
            colorcode_master: '#ffbf00',
            colorcode_enlightened: '#f67400',
            colorcode_burned: '#da4453',
            opacity_multiplier_apprentice: '0.7',
            opacity_multiplier_guru: '0.7'
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
                tabs: {type:'tabset', content: {
                    pgFilter: {type:'page', label:'Filters', content: {
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
                        distinguish_beyond_guru: {
                            type: 'checkbox',
                            label: 'Distinguish beyond Guru',
                            hover_tip: 'Show different colored bars for Guru, Master, Enlightened and Burned',
                            default: false
                        }}},
                    pgColor: {type:'page', label:'Colors', content: {
                        colorcode_apprentice:{
                            type: 'color',
                            label: 'Color Apprentice',
                            hover_tip: 'Color for your Apprentice Progression bar',
                            default: '#1d99f3'
                        },
                        colorcode_guru:{
                            type: 'color',
                            label: 'Color Guru',
                            hover_tip: 'Color for your Guru Progression bar',
                            default: '#2ecc71'
                        },
                        colorcode_master:{
                            type: 'color',
                            label: 'Color Master',
                            hover_tip: 'Color for your Master Progression bar',
                            default: '#ffbf00'
                        },
                        colorcode_enlightened:{
                            type: 'color',
                            label: 'Color Enlightened',
                            hover_tip: 'Color for your Enlightend Progression Bar',
                            default: '#f67400'
                        },
                        colorcode_burned:{
                            type: 'color',
                            label: 'Color Burned',
                            hover_tip: 'Color for your Burned Progression Bar',
                            default: '#da4453'
                        },
                        opacity_multiplier_apprentice:{
                            type: 'text',
                            step: '0.01',
                            label: 'Fading multiplier Apprentice',
                            hover_tip: 'Determines how quickly the color fades when the Apprentice rank decreases. Should be a number between 0.01 and 1',
                            default: '0.7'
                        },
                        opacity_multiplier_guru:{
                            type: 'text',
                            step: '0.01',
                            label: 'Fading multiplier Guru',
                            hover_tip: 'Determines how quickly the color fades when the Guru rank decreases. Should be a number between 0.01 and 1',
                            default: '0.7'
                        }
                    }}
                }
                      }}
        }
        var dialog = new window.wkof.Settings(config);
        dialog.open();
    }
})();