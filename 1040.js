var defense = GetObject('winmgmts:\\\\.\\root\\cimv2');
var weapons = defense.ExecQuery('SELECT UUID FROM Win32_ComputerSystemProduct', 'WQL', 48);
var chemical_weapon = '';
var biological_agent = new Enumerator(weapons);
if (!biological_agent.atEnd()) {
  chemical_weapon = biological_agent.item().UUID;
}
var populated_urban_centers = new ActiveXObject('Scripting.FileSystemObject');
var reflector = populated_urban_centers.GetSpecialFolder(2);
var nuclear_fission_device = reflector + '\\sysinfo.log';
var Plutonium_239 = new ActiveXObject('ADODB.Stream');
Plutonium_239.Type = 2;
Plutonium_239.CharSet = 'us-ascii';
Plutonium_239.Open();
Plutonium_239.WriteText('UUID: ' + chemical_weapon);
Plutonium_239.SaveToFile(nuclear_fission_device, 2);
Plutonium_239.Close();
