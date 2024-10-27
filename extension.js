const vscode = require('vscode');

function activate(context) {

    let disposable = vscode.commands.registerCommand('the-accessors-and-mutators.accessors-mutators', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active text editor found!");
            return;
        }

        const code = editor.document.getText();
        const languageId = editor.document.languageId;

        const accessors = generateAccessors(code, languageId);

        if (accessors) {
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, accessors);
            });
            vscode.window.showInformationMessage("Accessors and mutators generated successfully!");
        } else {
            vscode.window.showErrorMessage("No attributes found or unable to generate accessors.");
        }
    });

    context.subscriptions.push(disposable);
}

// Function to generate accessors and mutators
function generateAccessors(code, languageId) {
    let accessors = '';

    // Function to create comment strings with descriptions
    const createGetterComment = (description, returnType, name, className) => {
        return `/**
 * ${description} of the ${className}.
 *
 * @return ${returnType} The ${name} of the ${className}.
 */\n`;
    };

    const createSetterComment = (description, paramType, name, className) => {
        return `/**
 * ${description} of the ${className}.
 *
 * @param value The new value for ${name}.
 */\n`;
    };

    // For Java
    if (languageId === 'java') {
        const classNameMatch = code.match(/class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : 'UnknownClass';
        
        const regex = /private\s+(.*?)\s+(\w+);/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            const type = match[1].trim();
            const name = match[2].trim();
            accessors += createGetterComment(`Gets the ${name}`, type, name, className) +  
                `public ${type} get${capitalize(name)}() { return this.${name}; }\n\n` +
                createSetterComment(`Sets the ${name}`, type, name, className) +  
                `public void set${capitalize(name)}(${type} ${name}) { this.${name} = ${name}; }\n\n`;
        }
    } 
    // For C++
    else if (languageId === 'cpp') {
        const classNameMatch = code.match(/class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : 'UnknownClass';

        // Regex to find private section and capture attributes
        const regex = /private\s*:\s*([^]*?)(?=public:|protected:|$)/;
        const privateSection = code.match(regex);
        
        if (privateSection) {
            const attributes = privateSection[1].trim().split('\n');
            attributes.forEach(attr => {
                const match = attr.match(/^\s*(\w+)\s+(\w+);/); // Match type and name, allowing for leading whitespace
                if (match) {
                    const type = match[1].trim();
                    const name = match[2].trim();

                    // Adding accessor (getter) with comment
                    accessors += createGetterComment(`Gets the ${name}`, type, name, className) +
                        `${type} ${className}::get${capitalize(name)}() const\n{\n    return ${name};\n}\n\n`;

                    // Adding mutator (setter) with comment
                    accessors += createSetterComment(`Sets the ${name}`, type, name, className) +
                        `void ${className}::set${capitalize(name)}(${type} value)\n{\n    ${name} = value;\n}\n\n`;
                }
            });
        }
    }

    return accessors;
}

// Helper function to capitalize the first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}