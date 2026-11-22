// Vite replaces import.meta.env in the app; Jest uses an empty environment.
module.exports = function ({ types }) {
    return {
        visitor: {
            MemberExpression(path) {
                if (types.isMetaProperty(path.node.object) && path.node.property.name === "env") {
                    path.replaceWith(types.objectExpression([]));
                }
            },
        },
    };
};
