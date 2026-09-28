# ponytail: locks ARCHITECTURE_LOGIC mechanical rules; extend when adding slices/domains
$err = 0
function Fail($m) { Write-Output "FAIL: $m"; $script:err++ }
$fe = "src/frontend/src"; $be = "src/backend"
# 1. barrels only services/*/api/index.ts + types/index.ts
Get-ChildItem $fe -Recurse -Filter index.ts | ForEach-Object {
  $r = $_.FullName.Replace("$PWD\", "")
  if ($r -notmatch 'services\\[^\\]+\\(api|types)\\index\.ts$') { Fail "barrel $r" } }
# 2. no *Page.tsx, pages live in features/<d>/pages, no top-level pages/
Get-ChildItem "$fe/features" -Recurse -Filter '*Page.tsx' | ForEach-Object { Fail "page-suffix $($_.Name)" }
if (Test-Path "$fe/pages") { Fail "top-level pages/ exists" }
# 3. every slice route guarded
$router = Get-Content "$fe/app/router.tsx" -Raw
$n = ([regex]::Matches($router, 'PERMISSIONS\.\w+')).Count
if ($n -lt 8) { Fail "only $n guarded slice routes, need 8" }
# 4. no raw fetch / axios outside services/
Get-ChildItem $fe -Recurse -Include *.tsx,*.ts | Select-String -Pattern 'fetch\(|from .axios.' |
  Where-Object { $_.Path -notmatch '\\services\\' } | ForEach-Object { Fail "direct-http $($_.Path):$($_.LineNumber)" }
# 5. backend Get tools per domain + Edit tools where writes exist (Table 4)
@('Surveillance','Forecast','RiskMaps','Rag','Playbook','Alerts','Citizen','Reports','SystemUser','Messaging','System') |
  ForEach-Object { if (!(Test-Path "$be/HealthAlert.Tools/$($_)GetTools.cs")) { Fail "missing $($_)GetTools" } }
@('Surveillance','Forecast','Rag','Playbook','Alerts','SystemUser') |
  ForEach-Object { if (!(Test-Path "$be/HealthAlert.Tools/$($_)EditTools.cs")) { Fail "missing $($_)EditTools" } }
# 6. menu tree exists
if (!(Test-Path "$fe/constants/layout/menu/menu.tsx")) { Fail "missing constants/layout/menu/menu.tsx" }
if ($err -eq 0) { Write-Output "architecture OK" } else { exit 1 }
