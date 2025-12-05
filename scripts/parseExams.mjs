import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN_KEYWORDS = {
  'Cloud Concepts': [
    'cloud computing', 'benefit', 'advantage', 'agility', 'elasticity', 
    'scalability', 'high availability', 'fault tolerance', 'design principle',
    'well-architected', 'pillar', 'capex', 'opex', 'global infrastructure',
    'region', 'availability zone', 'edge location'
  ],
  'Security & Compliance': [
    'security', 'iam', 'mfa', 'encryption', 'kms', 'shield', 'waf', 
    'compliance', 'shared responsibility', 'access control', 'permission',
    'policy', 'role', 'credential', 'audit', 'cloudtrail',
    'inspector', 'guardduty', 'macie', 'artifact', 'trusted advisor security',
    'penetration', 'ddos', 'firewall', 'acl', 'security group', 'vpc security'
  ],
  'Technology': [
    'ec2', 's3', 'rds', 'dynamodb', 'lambda', 'vpc', 'cloudfront', 'route 53',
    'elb', 'auto scaling', 'ecs', 'eks', 'fargate', 'elastic beanstalk',
    'cloudformation', 'api gateway', 'sqs', 'sns', 'kinesis', 'redshift',
    'aurora', 'elasticache', 'ebs', 'efs', 'glacier', 'snowball', 'database',
    'storage', 'compute', 'container', 'serverless', 'migration', 'networking',
    'direct connect', 'vpn', 'instance', 'ami', 'emr', 'athena', 'glue'
  ],
  'Billing & Pricing': [
    'cost', 'price', 'pricing', 'billing', 'budget', 'cost explorer',
    'reserved', 'spot', 'on-demand', 'savings plan', 'free tier',
    'calculator', 'tco', 'consolidated billing', 'organization', 'discount',
    'pay-as-you-go', 'support plan', 'enterprise', 'business support',
    'developer support', 'basic support', 'tam', 'concierge'
  ]
};

function detectDomain(questionText) {
  const text = questionText.toLowerCase();
  const scores = {};

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    scores[domain] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[domain] += 1;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'Technology';
  
  return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'Technology';
}

function parseMarkdown(content, examId) {
  const questions = [];
  
  // Split by question numbers (1. 2. 3. etc at the start of a line)
  const questionBlocks = content.split(/\n(?=\d+\.\s)/);
  
  for (const block of questionBlocks) {
    // Match question number
    const numMatch = block.match(/^(\d+)\.\s/);
    if (!numMatch) continue;
    
    const questionIndex = parseInt(numMatch[1]);
    
    // Extract correct answer from <details> block
    const answerMatch = block.match(/Correct answer:\s*([A-E](?:,\s*[A-E])*)/i);
    if (!answerMatch) continue;
    
    const answers = answerMatch[1].split(',').map(a => a.trim().toLowerCase());
    
    // Remove the <details> section
    const blockWithoutDetails = block.replace(/<details[\s\S]*?<\/details>/gi, '');
    
    // Extract question text (everything after "1. " until first "- A.")
    const lines = blockWithoutDetails.split('\n');
    
    let promptLines = [];
    const options = [];
    let foundFirstOption = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and the question number line start
      if (!trimmed) continue;
      
      // Check for option lines: "- A. text" or "    - A. text"
      const optionMatch = trimmed.match(/^-\s*([A-E])[\.\)]\s*(.*)$/i);
      
      if (optionMatch) {
        foundFirstOption = true;
        options.push({
          id: optionMatch[1].toLowerCase(),
          text: optionMatch[2].trim()
        });
      } else if (!foundFirstOption) {
        // This is part of the question prompt
        // Remove leading question number if present
        const cleanLine = trimmed.replace(/^\d+\.\s*/, '');
        if (cleanLine) {
          promptLines.push(cleanLine);
        }
      }
    }
    
    const prompt = promptLines.join(' ').replace(/\s+/g, ' ').trim();
    
    if (!prompt || options.length < 2) continue;
    
    questions.push({
      id: `${examId}-q${questionIndex.toString().padStart(3, '0')}`,
      examId,
      index: questionIndex,
      prompt: prompt,
      options: options,
      correctOptionIds: answers,
      multiSelect: answers.length > 1,
      domain: detectDomain(prompt + ' ' + options.map(o => o.text).join(' ')),
      source: examId
    });
  }
  
  return questions;
}

async function fetchExam(examNumber) {
  const url = `https://raw.githubusercontent.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/master/practice-exam/practice-exam-${examNumber}.md`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch exam ${examNumber}: ${response.status}`);
  }
  return response.text();
}

async function main() {
  const allQuestions = [];
  
  console.log('Fetching and parsing practice exams...');
  
  for (let i = 1; i <= 23; i++) {
    try {
      console.log(`Processing exam ${i}...`);
      const content = await fetchExam(i);
      const questions = parseMarkdown(content, `practice-exam-${i}`);
      console.log(`  Found ${questions.length} questions`);
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`Error processing exam ${i}:`, error);
    }
  }
  
  console.log(`\nTotal questions: ${allQuestions.length}`);
  
  // Domain breakdown
  const domainCounts = {};
  for (const q of allQuestions) {
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
  }
  console.log('\nDomain breakdown:');
  for (const [domain, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${domain}: ${count}`);
  }
  
  // Multi-select count
  const multiSelectCount = allQuestions.filter(q => q.multiSelect).length;
  console.log(`\nMulti-select questions: ${multiSelectCount}`);
  
  // Write to file
  const outputPath = path.join(__dirname, '../src/data/questions.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));
  console.log(`\nWritten to ${outputPath}`);
}

main().catch(console.error);
