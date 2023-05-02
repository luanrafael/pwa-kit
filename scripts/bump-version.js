#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const path = require('path')

// Exit upon error
sh.set('-e')

const lernaConfigPath = path.join(__dirname, '..', 'lerna.json')
const rootPkgPath = path.join(__dirname, '..', 'package.json')
const rootPkgLockPath = path.join(__dirname, '..', 'package-lock.json')

const retailReactAppPkgDir = path.join(__dirname, '..', 'packages/template-retail-react-app')

const main = () => {
    const retailReactAppPkg = JSON.parse(sh.cat(path.join(retailReactAppPkgDir, 'package.json')))
    const ignoreList = [
        {
            pathToPackage: retailReactAppPkgDir, 
            oldVersion: retailReactAppPkg.version
        }
    ]

    // TODO: during our release process, it looks like we should be tagging with annotated tags:
    // https://lerna.js.org/docs/troubleshooting#publish-does-not-detect-manually-created-tags-in-fixed-mode-with-githubgithub-enterprise
    sh.exec(`lerna version --no-push --no-git-tag-version --yes ${process.argv.slice(2).join(' ')}`)
    // TODO: is this really necessary?
    // sh.exec(`npm install`)

    const lernaConfig = JSON.parse(sh.cat(lernaConfigPath))
    const rootPkg = JSON.parse(sh.cat(rootPkgPath))
    const rootPkgLock = JSON.parse(sh.cat(rootPkgLockPath))

    const newVersion = lernaConfig.version

    // find all monorepo packages, look inside each package json, find peerDependency that is a monorepo package
    // and update it with a new version
    const {stdout} = sh.exec('lerna list --all --json', {silent: true})
    const packages = JSON.parse(stdout.toString())
    const lernaPackageNames = packages.map((pkg) => pkg.name)
    packages.forEach(({location}) => {
        const pkgFilePath = path.join(location, 'package.json')
        const pkg = JSON.parse(sh.cat(pkgFilePath))
        const peerDependencies = pkg.peerDependencies
        if (!peerDependencies) return
        Object.keys(peerDependencies).forEach((dep) => {
            if (lernaPackageNames.includes(dep)) {
                console.log(`Found lerna local package ${dep} as a peer dependency of ${pkg.name}.`)
                peerDependencies[dep] = `^${newVersion}`
                saveJSONToFile(pkg, pkgFilePath)
            }
        })
    })

    // update versions for root package and root package lock
    rootPkg.version = newVersion
    // TODO: there are actually 2 places where 'version' appears -> better to use `npm version <version-number>` to update
    rootPkgLock.version = newVersion
    saveJSONToFile(rootPkg, rootPkgPath)
    saveJSONToFile(rootPkgLock, rootPkgLockPath)

    ignoreList.forEach(({pathToPackage, oldVersion}) => {
        restorePackageVersion(pathToPackage, oldVersion)
        // If the package's dependency versions are updated, this change is still intact.
        // Only the package's own version is restored.
    })
    // TODO: some packages may depend on the packages listed in the ignoreList. We'll need to make sure those packages have the correct dependency version.
}

const saveJSONToFile = (json, filePath) => {
    new sh.ShellString(JSON.stringify(json, null, 2)).to(filePath)
}

const restorePackageVersion = (pathToPackage, versionNumber) => {
    sh.cd(pathToPackage)
    sh.exec(`npm version ${versionNumber}`)
    sh.cd('-')
}

main()
