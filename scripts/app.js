'use strict';

// var env = 'dev';
var env = 'prod';
// var env = 'test';
var hostname = '';
var port = '';
var connectionPath = '';
switch (env) {
    case 'prod':
        hostname = 'www.arks-zoo.xyz';
        connectionPath = `https://${hostname}/`;
        break;
    case 'dev':
        hostname = 'localhost';
        port = '44347';
        connectionPath = `https://${hostname}:${port}/`;
        break;
    case 'test':
        hostname = 'testing.arks-zoo.xyz';
        connectionPath = `https://${hostname}/`;
        break;
    default:
        hostname = '';
        port = '';
}

var serverStatus = 0;
var backupStatus;
var mapName;
var checkInterval = null;

$(document).ready(function() {
    init();

    $('#start-server').click(() => {
        startServerService(mapName);
        hideButton('start-server');
    })
    $('#stop-server').click(() => {
        $('#server-status').text('Stopping ...').css('color', 'orange');
        stopServerService();
        hideButton('stop-server');
    })
    $('#check-server').click(() => {
        $('#server-status').text('Checking ...').css('color', 'orange');
        getServerCurrentSave();
        serverStatusService();
    })
    $('#save-world').click(() => {
        saveWorldService();
    });
    $('#start-backup').click(() => {
        startBackupService();
        hideButton('start-backup');
    })
    $('#stop-backup').click(() => {
        stopBackupService();
        hideButton('stop-backup');
    })
    $('#check-backup').click(() => {
        backupStatusService();
        latestBackupService();
    })
    $('#manual-backup').click(() => {
        manualBackup();
    })
    $('#edit').click(() => {
        $('.server-config').hide();
        $('.edit-form').show();
    })
    $('#cancel-edit').click(() => {
        $('.server-config').show();
        $('.edit-form').hide();
    })
    $('form').on("submit", function(event) {
        event.preventDefault();
        var form = $('form').serializeArray();

        mapName = form[0].value;
        var GamePath = form[1].value;
        var BackupPath = form[2].value;
        var BackupInterval = parseInt(form[3].value);
        var HoursSave = parseInt(form[4].value);

        var serverObject = {
            "MapName": mapName,
            "GamePath": GamePath,
            "BackupPath": BackupPath,
            "BackupInterval": BackupInterval,
            "HoursSave": HoursSave
        };

        updateServerService(JSON.stringify(serverObject)).then(function() {
            getServerConfig();
            latestBackupService();
        });
    });

    $('#update').click(function() {
        if ($('.admin-class').css('display') == 'none') {
            $('.admin-class').show();
        } else $('.admin-class').hide();
    })
});

var init = function() {
    $('#server-status').text('Checking ...').css('color', 'orange');
    $('#save-world').hide();
    hideButton('stop-server');
    getServerConfig();
    getCurrentServerSettings();
    latestBackupService();
    getServerCurrentSave();
    backupStatusService();
    serverStatusService();
    serverStats();
    $('#online-players').hide();
    $('.edit-form').hide();
    console.log('Application started');
}

var hideButton = function(componentName) {
    if (componentName.includes('start')) {
        $('#' + componentName).hide();
        $('#stop-' + componentName.replace('start-', '')).show();
    } else if (componentName.includes('stop')) {
        $('#' + componentName).hide();
        $('#start-' + componentName.replace('stop-', '')).show();
    }
}

/* HTTP Methods v */
var getServerConfig = function() {
    $.get(`${connectionPath}server/settings`, function(res) {
        console.log('get server config');
        // console.log(res);
        mapName = res.MapName;
        switch (res.MapName) {
            case 'TheIsland':
                $('#map-name').text('The Island');
                break;
            case 'TheCenter':
                $('#map-name').text('The Center');
                break;
            default:
                $('#map-name').text('Map Name Unavailable');
        }

        $('#map-name-config').text(mapName);
        $('#map-name').val(mapName);

        $('#game-path-config').text(res.GamePath);
        $('#game-path').val(res.GamePath);

        $('#backup-path-config').text(res.BackupPath);
        $('#backup-path').val(res.BackupPath);

        $('#backup-interval-config').text(res.BackupInterval);
        $('#backup-interval').val(res.BackupInterval);

        $('#hours-save-config').text(res.HoursSave);
        $('#hours-save').val(res.HoursSave);
    });
}

var updateServerService = async function(data) {
    var success = function() {
        console.log('Server config updated');
        $('.edit-form').hide();
        $('.server-config').show();
    }
    await $.ajax({
        type: 'POST',
        url: `${connectionPath}server/settings`,
        data: data,
        contentType: 'application/json',
        success: success
    }).fail(function(res) {
        console.log(`Status: ${res.status}, Reason: ${res.statusText}`);
        console.log(res.responseJSON.errors)
    })
}
var startServerService = function(mapName) {
    mapName = mapName.trim().replace(' ', '');
    //Map Name validation
    $.get(`${connectionPath}server/start/${mapName}`, function(res) {
        console.log(`Starting ${mapName}`);
        console.log(res);
        $('#server-status').text('Starting ...').css('color', 'orange');
    }).then(function() {
        setTimeout(function() {
            serverStatusService();
        }, 100);
    });
}
var stopServerService = async function() {
    await $.get(`${connectionPath}server/stop`, function(res) {
        console.log(`Stopping server`);
    }).then(function() {
        serverStatus = 0;
        getServerCurrentSave();
        setTimeout(function() {
            serverStatusService();
        }, 2000)
        if (checkInterval) {
            clearInterval(checkInterval);
        }
        if (backupStatus) {
            stopBackupService();
        }
    });
}
var serverStatusService = async function() {
    console.log('Running server status check');

    serverCall().then(() => {
        if (serverStatus == 200) {
            if (checkInterval != null) {
                clearInterval(checkInterval);
            }
            $('#server-status').text('Online').css('color', 'lightgreen');
            $('#save-world').show();
            hideButton('start-server');
        } else if (serverStatus == 202) {
            $('#server-status').text('Starting ...').css('color', 'orange');
            hideButton('start-server');
            checkInterval = setInterval(function() {
                serverCall();
                if (serverStatus == 200) {
                    clearInterval(checkInterval);
                    startBackupService();
                    serverStatusService();
                }
            }, 30 * 1000); //Every 30 sec
        } else if (serverStatus == 204) {
            if (checkInterval != null) {
                clearInterval(checkInterval);
            }
            $('#server-status').text('Offline').css('color', 'red');
            hideButton('stop-server');
            $('#save-world').hide();
        }
    });
};

var serverCall = async function() {
    // var result;
    await $.ajax({
        type: 'GET',
        url: `${connectionPath}server/status`,
        success: function(data, textStatus, xhr) {
            serverStatus = xhr.status;
        }
    });
    // return result;
}

var serverStats = function() {
    $.get(`${connectionPath}server/stats`, function(res) {
        if (res.length > 1) {
            $('#current-players').text(`${res[0]} / ${res[1]}`);
            $('#online-players').show();
        }
    })
}

var startBackupService = async function() {
    await $.get(`${connectionPath}backup/start`, function(res) {
        console.log(`Starting backup`);
        console.log(res);
    }).then(function() {
        backupStatusService();
    });
}
var stopBackupService = async function() {
    await $.get(`${connectionPath}backup/stop`, function(res) {
        console.log(`Stopping backup`);
        console.log(res);
    }).then(function() {
        backupStatusService();
    });
}
var backupStatusService = function() {
    console.log('Running backup status check');
    $.get(`${connectionPath}backup/status`, function(res) {
        backupStatus = res;
        if (backupStatus) {
            $('#backup-status').text('Running').css('color', 'lightgreen');
            hideButton('start-backup');
        } else {
            $('#backup-status').text('Not Running').css('color', 'red');
            hideButton('stop-backup');
        }
    })
}

var latestBackupService = function() {
    console.log('Running latest backup check');
    $.get(`${connectionPath}backup/latest`, function(res) {
        $('#latest-backup').text(`Latest backup at ${res.slice(0,2)}:${res.slice(2,4)} ${res.slice(4,6)}, ${res.slice(7,9)}/${res.slice(9)}`).removeClass('red');
    })
}
var manualBackup = async function() {
    await $.get(`${connectionPath}backup/manual`, function(res) {
        console.log(res);
    }).then(function() {
        latestBackupService();
    });
}
var getServerCurrentSave = function() {
    $.get(`${connectionPath}backup/current`, function(res) {
        var time = new Date(res);
        $("#server-current-save").text(time.toLocaleString());
    })
}
var saveWorldService = async function() {
        await $.get(`${connectionPath}server/save`).then(function() {
            getServerCurrentSave();
        });
    }
    /* HTTP Methods ^ */
var getCurrentServerSettings = function() {
    var currentServerSettings = [
        'XPMultiplier = 3',
        'TamingSpeedMultiplier = 10 => TamingSpeedMultiplier = 15',
        'HarvestAmountMultiplier = 4',
        'NightTimeSpeedScale = 4',
        'DayTimeSpeedScale = 0.5',
        'PlayerCharacterWaterDrainMultiplier = 0.8',
        'PlayerCharacterFoodDrainMultiplier = 0.5',
        'PlayerCharacterStaminaDrainMultiplier = 0.8',
        'DinoCharacterStaminaDrainMultiplier = 0.5  => DinoCharacterStaminaDrainMultiplier = 0.3',
        'MapPlayerLocation = True',
        'PlayerDamageMultiplier = 2.0',
        'ItemStackSizeMultiplier = 10',
        'Added crossplay',
        'PlayerBaseStatMultipliers[7] = 3 (weight capacity)',
        'DifficultyOffset = 1.8',
        'OverrideOfficialDifficulty = 7.0'
    ]

    currentServerSettings.forEach(item => {
        $('#current-server-settings').append(`<li>${item}</li>`)
    })
}