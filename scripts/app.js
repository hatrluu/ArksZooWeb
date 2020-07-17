$(document).ready(function(){
    init();

    $('#start-server').click(()=>{
        startServerService();
    })
    $('#stop-server').click(()=>{
        stopServerService();
    })
    $('#check-server').click(()=>{
        serverStatusService();
    })
    $('#start-backup').click(()=>{
        startBackupService();
    })
    $('#stop-backup').click(()=>{
        stopBackupService();
    })
    $('#check-backup').click(()=>{
        backupStatusService();
        latestBackupService();
    })
});

var isProd = 'prod';
var hostname = isProd==='prod' ? 'www.arks-zoo.xyz': 'localhost';
var connectionPath = `https://${hostname}/`
var serverStatus;
var backupStatus;
var mapName = "TheIsland";

var init = function () {
    serverStatusService();
    backupStatusService();
    latestBackupService();
    getCurrentServerSettings();
    console.log('Application started');
}

var startServerService = function() {
    $.get(`${connectionPath}startServer/${mapName}`, function (res) {
        console.log(`Starting ${mapName}`);
        console.log(res);
    }).done(()=> {
        setTimeout(function () {
            serverStatusService();
        }, 2000);
    });
}
var stopServerService = function() {
    $.get(`${connectionPath}stopServer`, function (res) {
        console.log(`Stopping server`);
        console.log(res);
    }).done(()=> {
        setTimeout(function () {
            serverStatusService();
        }, 2000);
    });
}
var serverStatusService = function () { 
    console.log('Running server status check');
    $.get(`${connectionPath}IsServerOn`, function(res) {
        serverStatus = res;
        if(serverStatus) {
            $('#server-status').text('Online').addClass('green').removeClass('red');
        } else {
            $('#server-status').text('Offline').addClass('red').removeClass('green');
        }
    })
};


var startBackupService = function() {
    $.get(`${connectionPath}backup/startBackup`, function (res) {
        console.log(`Starting backup`);
        console.log(res);
    }).done(()=> {
        setTimeout(function () {
            backupStatusService();
        }, 2000);
    });
}
var stopBackupService = function() {
    $.get(`${connectionPath}backup/stopBackup`, function (res) {
        console.log(`Stopping backup`);
        console.log(res);
    }).done(()=> {
        setTimeout(function () {
            backupStatusService();
        }, 2000);
    });
}
var backupStatusService = function () {
    console.log('Running backup status check');
    $.get(`${connectionPath}backup/backupstatus`, function(res) {
        backupStatus = res;
        if(backupStatus) {
            $('#backup-status').text('Running').addClass('green').removeClass('red');
        } else {
            $('#backup-status').text('Not Running').addClass('red').removeClass('green');
        }
    })
}

var latestBackupService = function () {
    console.log('Running latest backup check');
    $.get(`${connectionPath}backup/latestBackup`, function(res) {
            $('#latest-backup').text(`Latest backup at ${res.slice(0,2)}:${res.slice(2,4)} ${res.slice(4,6)}, ${res.slice(7,9)}/${res.slice(9)}`).removeClass('red');
    })
}

var getCurrentServerSettings = function () {
    var currentServerSettings = [
        'XPMultiplier=3',
        'TamingSpeedMultiplier=10',
        'HarvestAmountMultiplier=4',
        'NightTimeSpeedScale=4',
        'DayTimeSpeedScale=0.5',
        'PlayerCharacterWaterDrainMultiplier=0.8',
        'PlayerCharacterFoodDrainMultiplier=0.5',
        'PlayerCharacterStaminaDrainMultiplier=0.8',
        'DinoCharacterStaminaDrainMultiplier=0.5',
        'MapPlayerLocation=True',
        'PlayerDamageMultiplier=2.0',
        'ItemStackSizeMultiplier=10',
        'Added crossplay',
        'PlayerBaseStatMultipliers[7]=2 -> double weight capacity'

    ]
    
    currentServerSettings.forEach(item => {
        $('#current-server-settings').append(`<li>${item}</li>`)
    })
}
