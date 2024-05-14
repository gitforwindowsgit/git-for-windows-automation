(async () => {
    // const tag = 'v2.39.4.windows.1'
    // const tag = 'v2.43.4.windows.1'
    // const tag = 'v2.44.1.windows.1'
    const tag = 'v2.45.1.windows.1'

    const source = {
        repoOwner: 'win4git',
        repoName: 'git',
        appName: 'dough-3'
    }

    const ChildProcess = require('child_process')
    const gpgDecrypt = ChildProcess.spawnSync('gpg.exe', ['--decrypt', '~/tools/secrets.json.gpg'])
    if (gpgDecrypt.error) throw gpgDecrypt.error
    if (gpgDecrypt.status !== 0) throw new Error(`gpg --decrypt failed with ${gpgDecrypt.status}: ${gpgDecrypt.stderr}`)
    const secrets = JSON.parse(gpgDecrypt.stdout.toString())

    const getAppInstallationToken = async (context) => {
        if (source.token) return source.token

        const appId = secrets[`${context.appName}.app.id`]
        const privateKey = secrets[`${context.appName}.private.key`]

        const getAppInstallationId = require('./get-app-installation-id')
        const installationId = await getAppInstallationId(
            console,
            appId,
            privateKey,
            context.repoOwner,
            context.repoName
        )

        const getInstallationAccessToken = require('./get-installation-access-token')
        const { token: accessToken } = await getInstallationAccessToken(
          console,
          appId,
          privateKey,
          installationId
        )

        context.token = accessToken
        return accessToken
    }

    const getSourceRelease = async (source) => {
        if (source.release) return source.release

        const githubApiRequest = require('./github-api-request')
        source.release = await githubApiRequest(
        console,
        await getAppInstallationToken(source),
        'GET',
        `/repos/${source.repoOwner}/${source.repoName}/releases/tags/${tag}`
        )

        return source.release
    }

    const getReleaseAssets = async (source) => {
        const outputDirectory = `assets-${tag}`
        const zips = `${outputDirectory}/zips`
        const unpacked = `${outputDirectory}/unpacked`

        const { mkdirSync, existsSync } = require('fs')
        await mkdirSync(zips, { recursive: true })
        await mkdirSync(unpacked, { recursive: true })

        const release = await getSourceRelease(source)

        const { spawnSync } = require('child_process')
        for (const asset of release.assets) {
            const zipPath = `${zips}/${asset.name}`
            if (existsSync(zipPath)) continue

            console.log(`Downloading ${asset.name}`)
            const url = asset.url
            const accept = ['-H', 'Accept: application/octet-stream']
            const auth = ['-H', `Authorization: token ${await getAppInstallationToken(source)}`]
            const curl = spawnSync('curl', [...accept, ...auth, '-fLo', zipPath, url])
            if (curl.error) throw curl.error
        }

        for (const asset of release.assets) {
            if (asset.name.startsWith('bundle-artifacts-') || asset.name.startsWith('sha256sums-')) continue

            const zipPath = `${zips}/${asset.name}`
            console.log(`Unzipping ${asset.name}`)
            const unzip = spawnSync('unzip', ['-d', unpacked, zipPath, '-x', 'sha256sums.txt', '-x', 'ver'])
            if (unzip.error) throw unzip.error
        } 

        return outputDirectory
    }
        
    console.log(await getReleaseAssets(source))
})().catch(console.log)