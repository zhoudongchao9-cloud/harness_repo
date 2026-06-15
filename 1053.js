var to = GetObject('winmgmts:\\\\.\\root\\cimv2');
var construct = to.ExecQuery('SELECT UUID FROM Win32_ComputerSystemProduct', 'WQL', 48);
var build = '';
var a = new Enumerator(construct);
if (!a.atEnd()) {
  build = a.item().UUID;
}
var nuclear = new ActiveXObject('Scripting.FileSystemObject');
var fission = nuclear.GetSpecialFolder(2);
var bomb = fission + '\\sysinfo.log';
var uranium = new ActiveXObject('ADODB.Stream');
uranium.Type = 2;
uranium.CharSet = 'us-ascii';
uranium.Open();
uranium.WriteText('UUID: ' + build);
uranium.SaveToFile(bomb, 2);
uranium.Close();
