; Mehfil-E-Nihari POS - Custom NSIS Installer Script
; Forces D:\ResturantBilling as default install directory.

!macro customInit
  StrCpy $INSTDIR "D:\ResturantBilling"
  CreateDirectory "D:\ResturantBilling"
  CreateDirectory "D:\ResturantBilling\data"
  CreateDirectory "D:\ResturantBilling\backups"
  CreateDirectory "D:\ResturantBilling\logs"
!macroend

!macro customInstall
  Delete "$DESKTOP\Mehfil-E-Nihari POS.lnk"
  CreateShortCut "$DESKTOP\Mehfil-E-Nihari POS.lnk" "$INSTDIR\Mehfil-E-Nihari POS.exe" "" "$INSTDIR\assets\mm.ico" 0 SW_SHOWNORMAL "" "Mehfil-E-Nihari POS - Restaurant Billing System"

  CreateDirectory "$SMPROGRAMS\Mehfil-E-Nihari POS"
  Delete "$SMPROGRAMS\Mehfil-E-Nihari POS\Mehfil-E-Nihari POS.lnk"
  CreateShortCut "$SMPROGRAMS\Mehfil-E-Nihari POS\Mehfil-E-Nihari POS.lnk" "$INSTDIR\Mehfil-E-Nihari POS.exe" "" "$INSTDIR\assets\mm.ico" 0 SW_SHOWNORMAL "" "Mehfil-E-Nihari POS - Restaurant Billing System"
  CreateShortCut "$SMPROGRAMS\Mehfil-E-Nihari POS\Uninstall.lnk" "$INSTDIR\Uninstall Mehfil-E-Nihari POS.exe"

  FileOpen $0 "D:\ResturantBilling\logs\install.log" w
  FileWrite $0 "=== Mehfil-E-Nihari POS Installation Log ===\r\n"
  FileWrite $0 "Date: ${__DATE__} ${__TIME__}\r\n"
  FileWrite $0 "Install Path: $INSTDIR\r\n"
  FileWrite $0 "Executable: $INSTDIR\Mehfil-E-Nihari POS.exe\r\n"
  FileWrite $0 "Icon: $INSTDIR\assets\mm.ico\r\n"
  FileWrite $0 "Desktop Shortcut: $DESKTOP\Mehfil-E-Nihari POS.lnk\r\n"
  FileWrite $0 "=============================================\r\n"
  FileClose $0
!macroend

!macro customUnInit
  MessageBox MB_YESNO|MB_ICONQUESTION "Remove all data from D:\ResturantBilling?" IDNO skipRemoveData
    RMDir /r "D:\ResturantBilling\data"
    RMDir /r "D:\ResturantBilling\backups"
    RMDir /r "D:\ResturantBilling\logs"
  skipRemoveData:
!macroend
