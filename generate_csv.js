const fs = require('fs');

const skills = {
  perfect: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Next.js', 'GraphQL', 'Docker', 'Redis', 'CI/CD', 'Kubernetes', 'Terraform'],
  strong: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind CSS', 'REST APIs', 'Git', 'Jest', 'Express.js', 'Prisma'],
  partial: ['JavaScript', 'Python', 'Django', 'SQL', 'HTML/CSS', 'Bootstrap', 'MySQL', 'Flask', 'Vue.js', 'Sass'],
  weak: ['Java', 'Spring Boot', 'Angular', 'C#', '.NET', 'PHP', 'Laravel', 'Kotlin', 'Swift', 'Rust'],
  none: ['Figma', 'Adobe XD', 'Photoshop', 'After Effects', 'Sketch', 'InVision', 'Illustrator', 'Canva']
};

const headlines = {
  perfect: [
    'Senior Full-Stack Engineer - React, Node.js & Cloud Infrastructure',
    'Lead Full-Stack Developer | TypeScript, AWS & Microservices Expert',
    'Full-Stack Software Engineer | React + Node.js + PostgreSQL',
    'Staff Engineer - Full-Stack JavaScript & Cloud Architecture',
    'Principal Full-Stack Developer | React, GraphQL, AWS & DevOps',
    'Senior Software Engineer | TypeScript, Next.js, Docker & K8s',
    'Full-Stack Architect | React Ecosystem, Node.js & Cloud Native',
    'Senior Platform Engineer | React, TypeScript, PostgreSQL & AWS',
  ],
  strong: [
    'Full-Stack Developer | React & Node.js Specialist',
    'Software Engineer - JavaScript, React & MongoDB',
    'Mid-Senior Full-Stack Developer | MERN Stack',
    'Full-Stack Web Developer | TypeScript & REST APIs',
    'Software Developer | React, Express & PostgreSQL',
    'Full-Stack Engineer | JavaScript, React, Tailwind CSS',
    'Web Application Developer | Node.js & React',
    'Full-Stack Developer | MongoDB, Express, React, Node.js',
  ],
  partial: [
    'Frontend Developer | JavaScript & React',
    'Backend Engineer | Python & Django',
    'Software Developer - Python, Flask & SQL',
    'Junior Full-Stack Developer | JavaScript & HTML/CSS',
    'Web Developer | HTML, CSS, JavaScript & Bootstrap',
    'Frontend Engineer | Vue.js & JavaScript',
    'Backend Developer | Python, Django & MySQL',
    'Software Engineering Intern | JavaScript & SQL',
  ],
  weak: [
    'Java Developer | Spring Boot & Microservices',
    'Backend Engineer | C# & .NET Core',
    'Software Engineer - Angular & Java Enterprise',
    'Mobile Developer | React Native & Kotlin',
    'PHP Developer | Laravel & MySQL',
    '.NET Developer | C#, ASP.NET & Azure',
    'Java Full-Stack Developer | Angular & Spring',
    'iOS Developer | Swift & Objective-C',
  ],
  none: [
    'UI/UX Designer | Figma & Adobe Creative Suite',
    'Product Designer - Mobile & Web Interfaces',
    'Graphic Designer | Branding & Visual Identity',
    'Motion Designer - After Effects & Cinema 4D',
    'Visual Designer | Sketch, Figma & Prototyping',
    'Brand Designer | Adobe Illustrator & InDesign',
    'UX Researcher | User Testing & Design Thinking',
    'Creative Director | Visual Design & Brand Strategy',
  ]
};

const firstNames = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Daniel','Lisa','Matthew','Nancy','Anthony','Betty','Mark','Margaret','Donald','Sandra','Steven','Ashley','Paul','Dorothy','Andrew','Kimberly','Joshua','Emily','Kenneth','Donna','Kevin','Michelle','Brian','Carol','George','Amanda','Timothy','Melissa','Ronald','Deborah','Jason','Stephanie','Edward','Rebecca','Ryan','Sharon','Jacob','Laura','Gary','Cynthia','Nicholas','Kathleen','Eric','Amy','Jonathan','Angela','Stephen','Shirley','Larry','Anna','Justin','Brenda','Scott','Pamela','Brandon','Emma','Benjamin','Nicole','Samuel','Helen','Gregory','Samantha','Frank','Katherine','Alexander','Christine','Raymond','Debra','Patrick','Rachel','Jack','Carolyn','Dennis','Janet','Jerry','Catherine','Tyler','Maria','Aaron','Heather','Jose','Diane','Nathan','Ruth','Henry','Julie','Douglas','Olivia','Zachary','Joyce','Peter','Virginia','Kyle','Victoria','Noah','Kelly','Ethan','Lauren','Jeremy','Christina','Walter','Joan','Christian','Evelyn','Keith','Judith','Roger','Megan','Terry','Andrea','Harry','Cheryl','Sean','Hannah','Austin','Jacqueline','Arthur','Martha','Lawrence','Gloria','Dylan','Teresa','Jesse','Ann','Jordan','Sara','Bryan','Madison','Billy','Frances','Bruce','Kathryn','Gabriel','Janice','Joe','Jean','Logan','Abigail','Albert','Alice','Willie','Judy','Alan','Sophia','Eugene','Grace','Russell','Denise','Philip','Amber','Randy','Doris','Wayne','Marilyn','Vincent','Danielle','Ralph','Beverly','Roy','Isabella','Bobby','Theresa','Johnny','Diana','Carl','Natalie'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson','Watson','Brooks','Chavez','Wood','Bennett','Gray','Mendoza','Ruiz','Hughes','Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez','Powell','Jenkins','Perry','Russell','Sullivan','Bell','Coleman','Butler','Henderson','Barnes','Fisher','Vasquez','Simmons','Marks','Fox','Spencer','Rao','Nakamura','Uwimana','Mugisha','Ingabire','Niyonzima','Habimana','Mutesi','Mugabo','Kalisa','Isimbi','Ndayisaba','Tuyishime','Nkurunziza','Rurema','Ngoga','Ishimwe','Munyentwari','Gasana','Bizimana'];
const locations = ['Kigali, Rwanda','Kigali, Rwanda','Kigali, Rwanda','Nairobi, Kenya','Lagos, Nigeria','Accra, Ghana','Kampala, Uganda','Dar es Salaam, Tanzania','Remote','Remote','San Francisco, USA','New York, USA','London, UK','Berlin, Germany','Toronto, Canada','Johannesburg, South Africa','Cape Town, South Africa','Amsterdam, Netherlands','Dubai, UAE','Singapore','Bangalore, India'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { const shuffled = [...arr].sort(() => Math.random() - 0.5); return shuffled.slice(0, Math.min(n, shuffled.length)); }
function uniqueEmail(fn, ln, i, used) {
  let base = (fn + '.' + ln).toLowerCase().replace(/\s+/g, '');
  let email = base + '@email.com';
  if (used.has(email)) email = base + i + '@email.com';
  let j = 2;
  while (used.has(email)) { email = base + i + '_' + j + '@email.com'; j++; }
  used.add(email);
  return email;
}

const usedEmails = new Set();
const rows = ['Full Name,Email,Phone,Headline,Location,Skills,LinkedIn,GitHub'];

for (let i = 0; i < 150; i++) {
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const email = uniqueEmail(fn, ln, i, usedEmails);
  const phone = '+250 7' + String(Math.floor(Math.random() * 90000000 + 10000000));
  const loc = pick(locations);

  let sk, hl;
  if (i < 15) {
    // Top tier: perfect match — these should score 80-100
    sk = pickN(skills.perfect, 7 + Math.floor(Math.random() * 5));
    hl = pick(headlines.perfect);
  } else if (i < 40) {
    // Strong match — should score 65-85
    const pool = [...skills.perfect.slice(0, 5), ...skills.strong];
    sk = pickN(pool, 5 + Math.floor(Math.random() * 4));
    hl = pick(headlines.strong);
  } else if (i < 80) {
    // Partial match — should score 45-65
    const pool = [...skills.strong.slice(0, 3), ...skills.partial];
    sk = pickN(pool, 4 + Math.floor(Math.random() * 4));
    hl = pick(headlines.partial);
  } else if (i < 120) {
    // Weak match — should score 25-50
    const pool = [...skills.partial.slice(0, 2), ...skills.weak];
    sk = pickN(pool, 3 + Math.floor(Math.random() * 4));
    hl = pick(headlines.weak);
  } else {
    // No match — should score 5-30
    sk = pickN(skills.none, 3 + Math.floor(Math.random() * 4));
    hl = pick(headlines.none);
  }

  const liSlug = fn.toLowerCase() + '-' + ln.toLowerCase() + (i > 30 ? i : '');
  const linkedin = 'https://linkedin.com/in/' + liSlug.replace(/\s+/g, '-');
  const ghSlug = fn.toLowerCase() + ln.toLowerCase().slice(0, 3) + (i > 20 ? i : '');
  const github = i < 120 ? 'https://github.com/' + ghSlug.replace(/\s+/g, '') : '';

  const skillStr = sk.join('; ');
  
  // Build CSV row — quote fields that might have commas
  const row = `${fn} ${ln},${email},${phone},"${hl}","${loc}","${skillStr}",${linkedin},${github}`;
  rows.push(row);
}

const outputPath = 'C:/Users/USER/OneDrive/Desktop/Umurava Screener AI/umurava-lens/test_candidates_150.csv';
fs.writeFileSync(outputPath, rows.join('\n'), 'utf8');
console.log(`Generated 150 candidates CSV at: ${outputPath}`);
console.log(`Row count (including header): ${rows.length}`);
console.log('\nTier distribution:');
console.log('  Perfect match (top scorers): candidates 1-15');
console.log('  Strong match: candidates 16-40');
console.log('  Partial match: candidates 41-80');
console.log('  Weak match: candidates 81-120');
console.log('  No match (lowest): candidates 121-150');
