
"use strict";

function createDeviceInfo(friendlyName, lowerName) {
    var info = { friendlyName: friendlyName };
    info.noSpaceName = info.friendlyName.replace(/ /g, '');
    info.camelName = info.noSpaceName.charAt(0).toLowerCase() + info.noSpaceName.slice(1);
    info.upperCamelName = info.noSpaceName.charAt(0).toUpperCase() + info.noSpaceName.slice(1);
    if (lowerName === undefined) {
        info.lowerName = info.noSpaceName.toLowerCase();
    } else {
        info.lowerName = lowerName;
    }
    info.capName = info.lowerName.charAt(0).toUpperCase() + info.lowerName.slice(1);

    return info;
}

function validateNotEmpty(message) {
    return function (input) {
        var pass = Boolean(input);
        if (pass) {
            return true;
        }

        return message;
    };
}

module.exports = {
    createDeviceInfo: createDeviceInfo,
    validateNotEmpty: validateNotEmpty
}
