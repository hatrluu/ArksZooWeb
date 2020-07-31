'use strict';

// var env = 'dev';
var env = 'prod';
// var env = 'test';
var hostname = '';
var port = '';
var connectionPath = '';
switch(env) {
    case 'prod':
        hostname = 'www.arks-zoo.xyz';
        port = '80';
        connectionPath = `https://${hostname}/`
        break;
    case 'dev':
        hostname = 'localhost';
        port = '44347';
        connectionPath = `https://${hostname}:${port}/`
        break;
    case 'test':
        hostname = 'testing.arks-zoo.xyz'
        port = '80';
        connectionPath = `https://${hostname}/`
        break;
    default:
        hostname = '';            
        port = '';
}

var serverStatus = 0;
var backupStatus;
var mapName = "The Island";
var checkInterval;

$(document).ready(function(){
    init();

    $('#start-server').click(()=>{
        startServerService(mapName);
        hideButton('start-server');
    })
    $('#stop-server').click(()=>{
        $('#server-status').text('Stopping ...').css('color','orange');
        stopServerService();
        hideButton('stop-server');
    })
    $('#check-server').click(()=>{
        $('#server-status').text('Checking ...').css('color','orange');
        getServerCurrentSave();
        serverStatusService(false);
    })
    $('#save-world').click(()=>{
        saveWorldService();
    });
    $('#start-backup').click(()=>{
        startBackupService();
        hideButton('start-backup');
    })
    $('#stop-backup').click(()=>{
        stopBackupService();
        hideButton('stop-backup');
    })
    $('#check-backup').click(()=>{
        backupStatusService();
        latestBackupService();
    })
    $('#test-backup').click(()=> {
        testBackup();
    })
    $('#edit').click(()=> {
        $('.server-config').hide();
        $('.edit-form').show();
    })
    $('#cancel-edit').click(()=>{
        $('.server-config').show();
        $('.edit-form').hide();
    })
    $('form').on("submit", function(event) {
        event.preventDefault();
        var form = $('form').serializeArray();
        
        var GamePath = form[0].value;
        var BackupPath = form[1].value;
        var BackupInterval = parseInt(form[2].value);
        var HoursSave = parseInt(form[3].value);
        
        var serverObject = {    "GamePath": GamePath, 
                                "BackupPath": BackupPath,
                                "BackupInterval": BackupInterval,
                                "HoursSave": HoursSave
                            };
        
        updateServerService(JSON.stringify(serverObject)).then(function() {
            getServerConfig();
            latestBackupService();
        });
    });

    $('#startCustomMap').click(()=>{
        startServerService('TheCenter');
    })

    $('#update').click(function() {
        if($('.admin-class').css('display') == 'none'){
            $('.admin-class').show();
        } else $('.admin-class').hide();
    })
});

var init = function () {
    $('#server-status').text('Checking ...').css('color','orange');
    $('#save-world').hide();
    hideButton('stop-server');
    getServerConfig();
    getCurrentServerSettings();
    latestBackupService();
    getServerCurrentSave();
    backupStatusService();
    serverStatusService(false);
    $('.edit-form').hide();
    $('#map-name').text(mapName);
    console.log('Application started');
}

var hideButton = function (componentName) {
    if(componentName.includes('start')){
        $('#'+componentName).hide();
        $('#stop-'+componentName.replace('start-','')).show();
    } else if (componentName.includes('stop')){
        $('#'+componentName).hide();
        $('#start-'+componentName.replace('stop-','')).show();
    }
}

/* HTTP Methods v */
var getServerConfig = function () {
    $.get(`${connectionPath}server/settings`, function(res) {
        console.log('get server config');
        //console.log(res);

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
    var success = function (){
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
var startServerService = async function(mapName) {
    mapName = mapName.trim().replace(' ', '');
    //Map Name validation
    await $.get(`${connectionPath}server/start/${mapName}`, function (res) {
        console.log(`Starting ${mapName}`);
        console.log(res);
        $('#server-status').text('Starting ...').css('color','orange');
    }).then(function(){
        checkInterval = setInterval(function () {
            serverStatusService(true);
            if(serverStatus == 200) {
                clearInterval(checkInterval);
                startBackupService();
            }
        }, 30*1000); //Every 30 sec
    });
}
var stopServerService = async function() {
    await $.get(`${connectionPath}server/stop`, function (res) {
        console.log(`Stopping server`);
    }).then(function(){
        serverStatus = 0;
        getServerCurrentSave();
        setTimeout(function(){
            serverStatusService(false);
        },2000)
        // if(checkInterval) {
        //     clearInterval(checkInterval);
        // }
        if(backupStatus) {
            stopBackupService();
        }
    });
}
var serverStatusService = function (isStarting) { 
    console.log('Running server status check');
    // $('#start-server').prop('disabled',true);
    $.ajax({
        type: 'GET',
        url: `${connectionPath}server/status`,
        success: function(data, textStatus, xhr) {
            if(xhr.status == 200) {
                serverStatus = xhr.status;
                $('#server-status').text('Online').css('color','lightgreen');
                $('#save-world').show();
                hideButton('start-server');
            }
        }
    }).fail(function() {
        if(isStarting) {
            $('#server-status').text('Starting ...').css('color','orange');
        } 
        else if(!isStarting || serverStatus == 0)
        {
            $('#server-status').text('Offline').css('color','red');
                    hideButton('stop-server');
                    $('#save-world').hide();
        }
     })
};

var startBackupService = async function() {
    await $.get(`${connectionPath}backup/start`, function (res) {
        console.log(`Starting backup`);
        console.log(res);
    }).then(function(){
        backupStatusService();
    });
}
var stopBackupService = async function() {
    await $.get(`${connectionPath}backup/stop`, function (res) {
        console.log(`Stopping backup`);
        console.log(res);
    }).then(function(){
        backupStatusService();
    });
}
var backupStatusService = function () {
    console.log('Running backup status check');
    $.get(`${connectionPath}backup/status`, function(res) {
        backupStatus = res;
        if(backupStatus) {
            $('#backup-status').text('Running').css('color','lightgreen');
            hideButton('start-backup');
        } else {
            $('#backup-status').text('Not Running').css('color','red');
            hideButton('stop-backup');
        }
    })
}

var latestBackupService = function () {
    console.log('Running latest backup check');
    $.get(`${connectionPath}backup/latest`, function(res) {
        $('#latest-backup').text(`Latest backup at ${res.slice(0,2)}:${res.slice(2,4)} ${res.slice(4,6)}, ${res.slice(7,9)}/${res.slice(9)}`).removeClass('red');
    })
}
var testBackup = async function () {
    await $.get(`${connectionPath}backup/test`, function(res) {
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
var saveWorldService = async function(){
    await $.get(`${connectionPath}server/save`).then(function() {
        getServerCurrentSave();
    });
}
/* HTTP Methods ^ */
var getCurrentServerSettings = function () {
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
