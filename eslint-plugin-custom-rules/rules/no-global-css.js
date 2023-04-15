module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Ensures that no global css imports are used.',
        },
        hasSuggestions: false,
        fixable: false
    },
    create: function create(context) {
        return {
            ImportDeclaration(node) {
                if(node.specifiers.length === 0 && /\.(css|scss)$/.test(node.source.value)) {
                    context.report({
                        node,
                        message: 'Do not use global css imports. Use css modules instead.'
                    });
                }
            }
        };
    }
};