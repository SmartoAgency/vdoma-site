import fs from "fs";
import path from "path";

const pageName = process.argv[2];

if (!pageName) {
  console.error("\x1b[31m%s\x1b[0m", "Error: Please provide a page name!");
  console.log("Usage: npm run create:page <page-name>");
  process.exit(1);
}

const pageDir = path.join("src", "pages", pageName);

if (fs.existsSync(pageDir)) {
  console.error("\x1b[31m%s\x1b[0m", `Error: Page '${pageName}' already exists.`);
  process.exit(1);
}

fs.mkdirSync(pageDir, { recursive: true });

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const funcName = `init${capitalize(pageName)}`;
const pugContent = `extends /../index.pug

block variable
  -
    var title_page = '${pageName}'
    var id_page = 'id-page-${pageName}'

block meta
  title= title_page
  meta(name='description', content='')

block header
  +header() 

block content
  h1 Page: ${pageName}
  p This is the content for the ${pageName} page.

block footer
  +footer()

block scripts
  script(type="module" src="/src/pages/${pageName}/${pageName}.js")
`;

const scssContent = `// Styles for the ${pageName} page
`;

const jsContent = `import './${pageName}.scss';

function ${funcName}() {

};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ${funcName});
} else {
  ${funcName}();
}
`;

try {
  fs.writeFileSync(path.join(pageDir, `${pageName}.pug`), pugContent);
  fs.writeFileSync(path.join(pageDir, `${pageName}.scss`), scssContent);
  fs.writeFileSync(path.join(pageDir, `${pageName}.js`), jsContent);

  console.log("\x1b[32m%s\x1b[0m", `Page '${pageName}' created successfully at ${pageDir}`);
} catch (error) {
  console.error("\x1b[31m%s\x1b[0m", "An error occurred while creating the files:", error);
  process.exit(1);
}
