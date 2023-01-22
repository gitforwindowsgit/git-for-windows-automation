const artifacts = process.argv.slice(2)

if (artifacts.length < 1) {
    throw new Error("No artifacts provided. Provide in the format ./create-artifacts-matrix.js ARTIFACT1 ARTIFACT2")
}

const validArtifacts = [
    {
        name: "installer",
        filePrefix: "Git",
        fileExtension: "exe"
    },
    {
        name: "portable",
        filePrefix: "PortableGit",
        fileExtension: "exe"
    },
    {
        name: "archive",
        filePrefix: "Git",
        fileExtension: "tar.bz2"
    },
    {
        name: "mingit",
        filePrefix: "MinGit",
        fileExtension: "zip"
    },
    {
        name: "mingit-busybox",
        filePrefix: "MinGit",
        fileExtension: "zip"
    }
]

const artifactsToBuild = []

for (const artifact of artifacts) {
    const artifactObject = validArtifacts.find(a => a.name === artifact)
    if (!artifactObject) {
        throw new Error(`${artifact} is not a valid artifact`)
    }

    artifactsToBuild.push(artifactObject)
}

console.log(JSON.stringify({artifact: artifactsToBuild}))
