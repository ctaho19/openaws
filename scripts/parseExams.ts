import * as fs from 'fs';
import * as path from 'path';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  examId: string;
  index: number;
  prompt: string;
  options: Option[];
  correctOptionIds: string[];
  multiSelect: boolean;
  domain: string;
  source: string;
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'Cloud Concepts': [
    'cloud computing', 'benefit', 'advantage', 'agility', 'elasticity', 
    'scalability', 'high availability', 'fault tolerance', 'design principle',
    'well-architected', 'pillar', 'capex', 'opex', 'global infrastructure',
    'region', 'availability zone', 'edge location'
  ],
  'Security & Compliance': [
    'security', 'iam', 'mfa', 'encryption', 'kms', 'shield', 'waf', 
    'compliance', 'shared responsibility', 'access control', 'permission',
    'policy', 'role', 'user', 'group', 'credential', 'audit', 'cloudtrail',
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

function detectDomain(questionText: string): string {
  const text = questionText.toLowerCase();
  const scores: Record<string, number> = {};

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

function parseMarkdown(content: string, examId: string): Question[] {
  const questions: Question[] = [];
  
  // Split by question pattern (starts with a question, ends with Answer/Correct answer)
  const lines = content.split('\n');
  let currentQuestion = '';
  let currentOptions: Option[] = [];
  let questionIndex = 0;
  let inQuestion = false;
  let waitingForAnswer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.startsWith('#') || line.startsWith('---')) continue;
    
    // Check if this is a correct answer line
    if (line.toLowerCase().startsWith('correct answer:')) {
      const answerMatch = line.match(/correct answer:\s*([A-E](?:,\s*[A-E])*)/i);
      if (answerMatch && currentQuestion && currentOptions.length > 0) {
        const answers = answerMatch[1].split(',').map(a => a.trim().toLowerCase());
        questionIndex++;
        
        questions.push({
          id: `${examId}-q${questionIndex.toString().padStart(3, '0')}`,
          examId,
          index: questionIndex,
          prompt: currentQuestion.trim(),
          options: currentOptions,
          correctOptionIds: answers,
          multiSelect: answers.length > 1,
          domain: detectDomain(currentQuestion + ' ' + currentOptions.map(o => o.text).join(' ')),
          source: examId
        });
      }
      
      // Reset for next question
      currentQuestion = '';
      currentOptions = [];
      inQuestion = false;
      waitingForAnswer = false;
      continue;
    }
    
    // Skip "Answer" line
    if (line.toLowerCase() === 'answer') {
      waitingForAnswer = true;
      continue;
    }
    
    // Check if this is an option line (starts with A., B., C., D., or E.)
    const optionMatch = line.match(/^([A-E])[\.\)]\s*(.+)$/i);
    if (optionMatch) {
      currentOptions.push({
        id: optionMatch[1].toLowerCase(),
        text: optionMatch[2].trim()
      });
      continue;
    }
    
    // If we have options already and hit a new line that's not an option,
    // it might be a continuation of the previous option or start of new question
    if (currentOptions.length > 0 && !waitingForAnswer) {
      // Check if next lines look like it could be a question
      if (line.endsWith('?') || 
          (line.length > 20 && !line.match(/^[A-E][\.\)]/i))) {
        // This might be continuation - append to last option or start new question
        // If it looks like a question (ends with ?), start new question
        if (currentQuestion && currentOptions.length > 0) {
          // We have a complete question but no answer found yet
          // Treat current text as new question
          currentQuestion = line;
          currentOptions = [];
        } else {
          currentQuestion = line;
        }
      }
      continue;
    }
    
    // Otherwise, this is likely part of the question
    if (!waitingForAnswer) {
      if (currentQuestion) {
        currentQuestion += ' ' + line;
      } else {
        currentQuestion = line;
      }
    }
  }
  
  return questions;
}

async function fetchExam(examNumber: number): Promise<string> {
  const url = `https://raw.githubusercontent.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes/master/practice-exam/practice-exam-${examNumber}.md`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch exam ${examNumber}: ${response.status}`);
  }
  return response.text();
}

async function main() {
  const allQuestions: Question[] = [];
  
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
  const domainCounts: Record<string, number> = {};
  for (const q of allQuestions) {
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
  }
  console.log('\nDomain breakdown:');
  for (const [domain, count] of Object.entries(domainCounts)) {
    console.log(`  ${domain}: ${count}`);
  }
  
  // Write to file
  const outputPath = path.join(__dirname, '../src/data/questions.json');
  fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));
  console.log(`\nWritten to ${outputPath}`);
}

main().catch(console.error);
