# Script para encontrar arquivos duplicados no projeto FinalizaBOT
# Verifica: nomes duplicados, conteúdo idêntico, componentes similares

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FinalizaBOT - Verificação de Arquivos Duplicados" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$duplicates = @{
    byName = @()
    bySize = @()
    byContent = @()
}

# Excluir diretórios
$excludeDirs = @('node_modules', '.next', 'dist', '.git', 'build', 'coverage', '.vercel', '.turbo')

# 1. Encontrar arquivos com mesmo nome
Write-Host "🔍 1. Procurando arquivos com mesmo nome..." -ForegroundColor Yellow
$allFiles = Get-ChildItem -Recurse -File | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
}

$fileGroups = $allFiles | Group-Object Name | Where-Object { $_.Count -gt 1 }

foreach ($group in $fileGroups) {
    $files = $group.Group | Select-Object FullName, Length
    if ($files.Count -gt 1) {
        $duplicates.byName += @{
            Name = $group.Name
            Count = $files.Count
            Files = $files
        }
    }
}

Write-Host "  Encontrados: $($duplicates.byName.Count) nomes duplicados" -ForegroundColor $(if ($duplicates.byName.Count -gt 0) { "Yellow" } else { "Green" })

# 2. Encontrar arquivos com mesmo tamanho
Write-Host "`n🔍 2. Procurando arquivos com mesmo tamanho (possíveis duplicatas)..." -ForegroundColor Yellow
$sizeGroups = $allFiles |
    Where-Object { $_.Length -gt 100 } |  # Ignorar arquivos muito pequenos
    Group-Object Length |
    Where-Object { $_.Count -gt 1 }

foreach ($group in $sizeGroups) {
    $files = $group.Group | Select-Object Name, FullName, Length
    $duplicates.bySize += @{
        Size = $group.Name
        Count = $files.Count
        Files = $files
    }
}

Write-Host "  Encontrados: $($duplicates.bySize.Count) grupos de arquivos com mesmo tamanho" -ForegroundColor $(if ($duplicates.bySize.Count -gt 0) { "Yellow" } else { "Green" })

# 3. Procurar por padrões específicos conhecidos
Write-Host "`n🔍 3. Procurando por padrões de duplicação conhecidos..." -ForegroundColor Yellow

# Padrão: Múltiplos package.json
$packageJsons = Get-ChildItem -Recurse -Filter "package.json" | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
}
Write-Host "  📦 package.json encontrados: $($packageJsons.Count)" -ForegroundColor Cyan
foreach ($pkg in $packageJsons) {
    Write-Host "     - $($pkg.FullName.Replace($PWD.Path, '.'))" -ForegroundColor Gray
}

# Padrão: Múltiplos tsconfig.json
$tsconfigs = Get-ChildItem -Recurse -Filter "tsconfig.json" | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
}
Write-Host "`n  📘 tsconfig.json encontrados: $($tsconfigs.Count)" -ForegroundColor Cyan
foreach ($ts in $tsconfigs) {
    Write-Host "     - $($ts.FullName.Replace($PWD.Path, '.'))" -ForegroundColor Gray
}

# Padrão: Múltiplos .env files
$envFiles = Get-ChildItem -Recurse -Filter ".env*" | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
}
Write-Host "`n  🔐 .env* arquivos encontrados: $($envFiles.Count)" -ForegroundColor Cyan
foreach ($env in $envFiles) {
    Write-Host "     - $($env.FullName.Replace($PWD.Path, '.'))" -ForegroundColor Gray
}

# Padrão: Múltiplos README
$readmes = Get-ChildItem -Recurse -Filter "README*" | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
}
Write-Host "`n  📄 README* arquivos encontrados: $($readmes.Count)" -ForegroundColor Cyan
foreach ($readme in $readmes) {
    Write-Host "     - $($readme.FullName.Replace($PWD.Path, '.'))" -ForegroundColor Gray
}

# 4. Componentes React duplicados (mesmo nome)
Write-Host "`n🔍 4. Procurando componentes React potencialmente duplicados..." -ForegroundColor Yellow
$reactComponents = Get-ChildItem -Recurse -Filter "*.tsx" | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | Where-Object { $path -like "*\$_\*" }) -and
    $path -like "*\components\*"
}

$componentGroups = $reactComponents | Group-Object Name | Where-Object { $_.Count -gt 1 }
if ($componentGroups.Count -gt 0) {
    Write-Host "  ⚠️  Componentes com mesmo nome encontrados:" -ForegroundColor Yellow
    foreach ($group in $componentGroups) {
        Write-Host "`n     📦 $($group.Name) ($($group.Count) arquivos):" -ForegroundColor Yellow
        foreach ($file in $group.Group) {
            Write-Host "        - $($file.FullName.Replace($PWD.Path, '.'))" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ✅ Nenhum componente duplicado encontrado" -ForegroundColor Green
}

# 5. Verificar arquivos .gitignore, .prettierrc, etc
Write-Host "`n🔍 5. Verificando arquivos de configuração..." -ForegroundColor Yellow

$configPatterns = @('.gitignore', '.prettierrc*', '.eslintrc*', 'prettier.config.*', 'eslint.config.*')
foreach ($pattern in $configPatterns) {
    $configs = Get-ChildItem -Recurse -Filter $pattern | Where-Object {
        $path = $_.FullName
        -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
    }
    if ($configs.Count -gt 1) {
        Write-Host "  ⚠️  Múltiplos $pattern encontrados:" -ForegroundColor Yellow
        foreach ($config in $configs) {
            Write-Host "     - $($config.FullName.Replace($PWD.Path, '.'))" -ForegroundColor Gray
        }
    }
}

# RELATÓRIO FINAL
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESUMO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Estatísticas:" -ForegroundColor Yellow
Write-Host "  • Arquivos com nome duplicado: $($duplicates.byName.Count)" -ForegroundColor $(if ($duplicates.byName.Count -gt 5) { "Red" } elseif ($duplicates.byName.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  • Grupos de arquivos com mesmo tamanho: $($duplicates.bySize.Count)" -ForegroundColor $(if ($duplicates.bySize.Count -gt 10) { "Red" } elseif ($duplicates.bySize.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  • Componentes React duplicados: $($componentGroups.Count)" -ForegroundColor $(if ($componentGroups.Count -gt 0) { "Red" } else { "Green" })
Write-Host ""

# Detalhes dos duplicados mais críticos
if ($duplicates.byName.Count -gt 0) {
    Write-Host "⚠️  ARQUIVOS COM NOME DUPLICADO (Top 10):" -ForegroundColor Yellow
    Write-Host ""

    $top10 = $duplicates.byName | Select-Object -First 10
    foreach ($dup in $top10) {
        Write-Host "  📄 $($dup.Name) ($($dup.Count) ocorrências):" -ForegroundColor Yellow
        foreach ($file in $dup.Files) {
            $relativePath = $file.FullName.Replace($PWD.Path, '.')
            $size = if ($file.Length -lt 1KB) { "$($file.Length)B" }
                    elseif ($file.Length -lt 1MB) { "$([math]::Round($file.Length/1KB, 1))KB" }
                    else { "$([math]::Round($file.Length/1MB, 1))MB" }
            Write-Host "     - $relativePath ($size)" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

# Recomendações
Write-Host "💡 RECOMENDAÇÕES:" -ForegroundColor Cyan
Write-Host ""

if ($packageJsons.Count -gt 3) {
    Write-Host "  ✅ Monorepo detectado ($($packageJsons.Count) package.json) - NORMAL" -ForegroundColor Green
}

if ($componentGroups.Count -gt 0) {
    Write-Host "  ⚠️  Revisar componentes duplicados - possível consolidação" -ForegroundColor Yellow
}

if ($duplicates.byName.Count -gt 20) {
    Write-Host "  ⚠️  Muitos arquivos com nomes duplicados - revisar estrutura" -ForegroundColor Yellow
} elseif ($duplicates.byName.Count -eq 0) {
    Write-Host "  ✅ Nenhum arquivo duplicado crítico encontrado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
