$(document).ready(function(){
    init();

    $('#start-server').click(()=>{
        startServerService(mapName);
        hideButton('start-server');
    })
    $('#stop-server').click(()=>{
        stopServerService();
        hideButton('stop-server');
    })
    $('#check-server').click(()=>{
        serverStatusService();
    })
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
    // $('#test-backup').click(()=> {
    //     testBackup();
    // })
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
        });
    });

    $('#startCustomMap').click(()=>{
        startServerService('TheCenter');
    })
});

var isProd = 'prod';
var hostname = isProd==='prod' ? 'www.arks-zoo.xyz': 'localhost';
var port = isProd==='prod' ? '80' : '44347';
var connectionPath = isProd === 'prod' ? `https://${hostname}/` : `https://${hostname}:${port}/`;
var serverStatus;
var backupStatus;
var mapName = "TheIsland";

var init = function () {
    serverStatusService();
    backupStatusService();
    latestBackupService();
    getServerConfig();
    getCurrentServerSettings();

    $('.admin-class').hide();
    $('.edit-form').hide();
    console.log(serverStatus);
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

var updateServerService = async function(data) {
    var success = function (){
        console.log('Server config updated');
        $('.edit-form').hide();
        $('.server-config').show();
    }
    await $.ajax({
        type: 'POST',
        url: `${connectionPath}servermodification`,
        data: data,
        contentType: 'application/json',
        success: success
    }).fail(function(res) {
         console.log(`Status: ${res.status}, Reason: ${res.statusText}`);
         console.log(res.responseJSON.errors)
     })
}
var startServerService = async function(mapName) {
    await $.get(`${connectionPath}startServer/${mapName}`, function (res) {
        console.log(`Starting ${mapName}`);
        console.log(res);
    }).then(function(){
        $('#server-status').text('Starting ...').css('color','orange');
        setTimeout(function(){
            serverStatusService()},300000);
    });
}
var stopServerService = async function() {
    await $.get(`${connectionPath}stopServer`, function (res) {
        console.log(`Stopping server`);
        console.log(res);
    }).then(function(){
        setTimeout(function() {
            serverStatusService();
        },500)
    });
}
var serverStatusService = function () { 
    console.log('Running server status check');
    $.get(`${connectionPath}IsServerOn`, function(res) {
        serverStatus = res;
        if(serverStatus) {
            $('#server-status').text('Online').css('color','lightgreen');
            hideButton('start-server');
        } else {
            $('#server-status').text('Offline').css('color','red');
            hideButton('stop-server');
        }
    })
};

var startBackupService = async function() {
    await $.get(`${connectionPath}backup/startBackup`, function (res) {
        console.log(`Starting backup`);
        console.log(res);
    }).then(function(){
        backupStatusService();
    });
}
var stopBackupService = async function() {
    await $.get(`${connectionPath}backup/stopBackup`, function (res) {
        console.log(`Stopping backup`);
        console.log(res);
    }).then(function(){
        backupStatusService();
    });
}
var backupStatusService = function () {
    console.log('Running backup status check');
    $.get(`${connectionPath}backup/backupstatus`, function(res) {
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
    $.get(`${connectionPath}backup/latestBackup`, function(res) {
            $('#latest-backup').text(`Latest backup at ${res.slice(0,2)}:${res.slice(2,4)} ${res.slice(4,6)}, ${res.slice(7,9)}/${res.slice(9)}`).removeClass('red');
    })
}
var testBackup = function () {
    $.get(`${connectionPath}backup/testbackup`, function(res) {
        console.log(res);
    });
}

var getServerConfig = function () {
    $.get(`${connectionPath}servermodification`, function(res) {
        console.log('get server config')
        console.log(res)
        $('#game-path-config').text(res.GamePath);
        $('#backup-path-config').text(res.BackupPath);
        $('#backup-interval-config').text(res.BackupInterval);
        $('#hours-save-config').text(res.HoursSave);
    });
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
