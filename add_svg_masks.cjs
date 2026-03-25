const fs = require('fs');
const path = require('path');

// SVG files to modify
const svgFiles = [
  'T-shirt (front).svg',
  'T-shirt (back).svg',
  'hoodie (front).svg',
  'hoodie (back).svg',
  'Jeans (front).svg',
  'Jeans (back).svg',
  'Jeans (front) (blue).svg',
  'Jeans (back) (blue).svg'
];

const mockImagesDir = path.join(__dirname, 'src', 'assets', 'mock images');

svgFiles.forEach(fileName => {
  const filePath = path.join(mockImagesDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${fileName}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if mask already exists
    if (content.includes('<mask')) {
      console.log(`⏭️  Skipping ${fileName} - mask already exists`);
      return;
    }

    // Extract SVG opening tag to get viewBox and dimensions
    const svgMatch = content.match(/<svg[^>]*>/);
    if (!svgMatch) {
      console.log(`❌ Could not find SVG tag in ${fileName}`);
      return;
    }

    const svgTag = svgMatch[0];
    
    // Parse viewBox or dimensions
    const viewBoxMatch = svgTag.match(/viewBox="([^"]*)"/);
    const widthMatch = svgTag.match(/width="([^"]*)"/);
    const heightMatch = svgTag.match(/height="([^"]*)"/);
    
    let viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1280 1280';
    let width = widthMatch ? widthMatch[1] : '1280';
    let height = heightMatch ? heightMatch[1] : '1280';

    // Create mask definition
    const maskDef = `
  <defs>
    <mask id="garmentMask-${fileName.replace(/\s+|[()]/g, '-')}">
      <!-- White rect covers entire canvas -->
      <rect width="${width}" height="${height}" fill="white"/>
      <!-- Black areas define masked-out regions (typically transparent areas) -->
    </mask>
    <!-- SVG Cutout Protection Filter -->
    <filter id="cutoutFilter-${fileName.replace(/\s+|[()]/g, '-')}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur"/>
      <feComponentTransfer in="blur">
        <feFuncA type="linear" slope="0.98"/>
      </feComponentTransfer>
    </filter>
  </defs>`;

    // Insert defs after SVG opening tag
    const modifiedContent = content.replace(
      />[\s\n]*/,
      `>
${maskDef}
`
    );

    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    console.log(`✅ Successfully added mask definition to ${fileName}`);

  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
  }
});

console.log('\n✨ SVG mask definitions added successfully!');
