var wmi = GetObject('winmgmts:\\\\.\\root\\cimv2');
var items = wmi.ExecQuery('SELECT UUID FROM Win32_ComputerSystemProduct', 'WQL', 48);
var uuid = '';

var enumerator = new Enumerator(items);
if (!enumerator.atEnd()) {
    uuid = enumerator.item().UUID;
}

var fso = new ActiveXObject('Scripting.FileSystemObject');
var tempPath = fso.GetSpecialFolder(2); // %TEMP%
var logFile = tempPath + '\\sysinfo.log';

var stream = new ActiveXObject('ADODB.Stream');
stream.Type = 2;
stream.CharSet = 'us-ascii';
stream.Open();
stream.WriteText('UUID: ' + uuid);
stream.SaveToFile(logFile, 2);
stream.Close();