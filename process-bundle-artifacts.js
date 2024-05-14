(async () => {
    const { processBundleArtifacts } = require('./github-release.js')
    const result = await processBundleArtifacts()
    console.log(JSON.stringify(result, null, 2))
})().catch(console.log)