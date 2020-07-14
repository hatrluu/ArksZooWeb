$(document).ready(function(){
    init();

    $('#check-server').click(()=>{
        serverStatusService();
    })
    $('#check-backup').click(()=>{
        latestBackupService();
    })
});

var hostname = 'localhost';
var isProd = 'dev';
var port = isProd==='prod' ? '5001' : '44347';
var connectionPath = `https://${hostname}:${port}/`
var serverStatus;
var backupStatus;



var init = function () {
    serverStatusService();
    backupStatusService();
    latestBackupService();
    getCurrentServerSettings();
    console.log('Application started');
}

var serverStatusService = function () { 
    $.get(`${connectionPath}IsServerOn`, function(res) {
        serverStatus = res;
        if(serverStatus) {
            $('#server-status').text('Online').addClass('green').removeClass('red');
        } else {
            $('#server-status').text('Offline').addClass('red').removeClass('green');
        }
    })
};

var backupStatusService = function () {
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