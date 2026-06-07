const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'mobile/src/app/services');
const pagesDir = path.join(__dirname, 'mobile/src/app');

// 1. Refatorar Services
const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));

services.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('http://localhost:5106/api/')) {
    // Add import if not exists
    if (!content.includes("import { environment }")) {
      content = "import { environment } from '../../environments/environment';\n" + content;
    }
    
    // Replace URL
    content = content.replace(
      /private apiUrl = 'http:\/\/localhost:5106\/api\/([^']+)';/g, 
      "private apiUrl = `${environment.apiUrl}/$1`;"
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated service: ${file}`);
  }
});

// 2. Refatorar Componentes TS
const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const allFiles = walkSync(pagesDir, []);

allFiles.filter(f => f.endsWith('.ts') && !f.includes('services\\')).forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('http://localhost:5106')) {
    if (!content.includes("import { environment }")) {
      // Find import depth
      const depth = filePath.split(path.sep).length - pagesDir.split(path.sep).length;
      const relativePath = depth === 2 ? '../../environments/environment' : '../../../environments/environment';
      content = `import { environment } from '${relativePath.replace(/\\/g, '/')}';\n` + content;
    }
    
    content = content.replace(/http:\/\/localhost:5106/g, "${environment.baseUrl}");
    fs.writeFileSync(filePath, content);
    console.log(`Updated component: ${path.basename(filePath)}`);
  }
});

// 3. Refatorar HTML
allFiles.filter(f => f.endsWith('.html')).forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('http://localhost:5106')) {
    // In Angular templates, we can't directly access 'environment'. 
    // Wait, the components usually do the resolution. 
    // In home.page.html, there is: 'http://localhost:5106' + post.imageUrl
    // In passport.page.html: 'http://localhost:5106' + photo.imageUrl
    // But now S3 returns full https URLs, so `post.imageUrl` might ALREADY start with http.
    // If it doesn't start with http, it's local. So we should use a helper method in the component.
    // The components already have `getImageUrl(url)`. Let's just use `getImageUrl(post.imageUrl)`.
    
    content = content.replace(/'http:\/\/localhost:5106' \+ ([a-zA-Z0-9_.]+)/g, "getImageUrl($1)");
    fs.writeFileSync(filePath, content);
    console.log(`Updated HTML: ${path.basename(filePath)}`);
  }
});
