import {
  withPlugins,
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
} from '@expo/config-plugins';
const pkg = require('../../package.json');

type Props = Partial<{}>;

const withHelios: ConfigPlugin<Props> = (config) => {
  if (config.ios == null) config.ios = {};
  const androidPermissions: readonly string[] = [];
  return withPlugins(config, [
    [AndroidConfig.Permissions.withPermissions, androidPermissions],
  ]);
};

export default createRunOncePlugin(withHelios, pkg.name, pkg.version);
