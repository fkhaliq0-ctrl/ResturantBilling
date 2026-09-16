Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "E:\ResturantBilling"

' 1. Start the master server / node backend hidden
WshShell.Run "npm run start", 0, False

' 2. Start the local window process hidden
WshShell.Run "npm run window", 0, False
