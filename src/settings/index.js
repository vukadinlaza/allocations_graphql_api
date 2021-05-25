module.exports = async (appEnv) => {
  let defaults = {}
  let envSettings = await import(`./${appEnv}.js`);
  return { ...defaults, ...envSettings, }
}
