import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assetUrl, emailUrl, featuredProjectOrder, filterProjects, findProject, getProjectRepositories, orderedProjects, profile, projects, webUrl } from '../src/data/content.ts';

test('project filters return exactly the matching projects in data-first order', () => {
  assert.equal(filterProjects('All').length, 6);
  assert.equal(filterProjects('Data Science & Analytics').length, 3);
  assert.equal(filterProjects('AI & Engineering').length, 3);
  assert.ok(filterProjects('Data Science & Analytics').every(p => p.category === 'Data Science & Analytics'));
  assert.ok(filterProjects('AI & Engineering').every(p => p.category === 'AI & Engineering'));
  assert.deepEqual(orderedProjects('All').slice(0,2).map(p => p.slug), featuredProjectOrder);
  assert.equal(new Set(projects.map(p => p.slug)).size, projects.length);
});
test('project lookup resolves every case study and rejects missing slugs', () => {
  for (const project of projects) assert.equal(findProject(project.slug), project);
  assert.equal(findProject('missing'), undefined);
  assert.equal(findProject(undefined), undefined);
  assert.equal(findProject(''), undefined);
});
test('missing and unsafe links are omitted; valid actions resolve correctly', () => {
  for (const input of [undefined, '', '#', 'javascript:alert(1)', 'data:text/html,bad', '/not-a-web-url']) assert.equal(webUrl(input), undefined);
  assert.equal(webUrl(profile.github), 'https://github.com/Rajpoot-10');
  assert.equal(webUrl(profile.linkedin), 'https://www.linkedin.com/in/hassam-ali-b88432317/');
  assert.equal(webUrl(undefined), undefined);
  assert.equal(assetUrl(profile.resume), undefined);
  assert.equal(assetUrl('/resume.pdf'), '/resume.pdf');
  assert.equal(assetUrl('//unknown.test/asset'), undefined);
  assert.equal(emailUrl(profile.email), undefined);
  assert.equal(emailUrl('invalid'), undefined);
  assert.equal(emailUrl('hello@example.com\nBCC:other@example.com'), undefined);
  assert.equal(emailUrl('hello@example.com'), 'mailto:hello@example.com');
  assert.deepEqual(getProjectRepositories({ ...projects[0], github: undefined, repositories: undefined }), []);
  assert.deepEqual(getProjectRepositories({ ...projects[0], github: 'javascript:alert(1)', repositories: [{ label: 'Bad', url: '#' }] }), []);
  assert.deepEqual(getProjectRepositories(findProject('interactive-analytics-dashboards')!).map(link => link.url), [
    'https://github.com/Rajpoot-10/Netflix_EDA',
    'https://github.com/Rajpoot-10/Amazon_EDA',
    'https://github.com/Rajpoot-10/Super_store_EDA_Dashboard',
  ]);
});
test('project content preserves the supplied technology distinctions', () => {
  const sales = findProject('sales-inventory-analytics')!;
  assert.ok(!sales.stack.includes('n8n'));
  assert.equal(findProject('flight-management-system')?.category, 'AI & Engineering');
  assert.ok(projects.every(p => p.features.length && p.considerations.length && p.nextSteps.length));
});
