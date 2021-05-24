module.exports = async (appEnv) => {
  let defaults = {}
  let envSettings = await require(`./${appEnv}.js`);
  return { ...defaults, ...envSettings, }
}
