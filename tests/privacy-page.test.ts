import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

async function source(path: string): Promise<string> {
  try {
    return await readFile(new URL(path, projectRoot), 'utf8');
  } catch {
    return '';
  }
}

test('the public privacy route identifies the controller and explains the processing roles', async () => {
  const [routes, privacyComponent, privacyTemplate] = await Promise.all([
    source('src/app/app.routes.ts'),
    source('src/app/features/privacy/privacy.component.ts'),
    source('src/app/features/privacy/privacy.component.html'),
  ]);
  const privacyPage = `${privacyComponent}\n${privacyTemplate}`;

  assert.match(routes, /path:\s*'privacy'/);
  assert.match(routes, /features\/privacy\/privacy\.component/);
  assert.match(privacyPage, /Gianmichele Cancellaro/);
  assert.match(privacyPage, /CNCGMC01C09G793M/);
  assert.match(privacyPage, /info@prenota24\.com/);
  assert.match(privacyPage, /titolare del trattamento/i);
  assert.match(privacyPage, /responsabile del trattamento/i);
  assert.match(privacyPage, /WhatsApp/i);
  assert.match(privacyPage, /diritti/i);
});

test('every public data collection form links to the privacy notice before submission', async () => {
  const [register, booking, event, domainModel] = await Promise.all([
    source('src/app/features/register/register.component.ts'),
    source('src/app/features/public-booking/public-booking.component.ts'),
    source('src/app/features/public-event/public-event.component.ts'),
    source('src/app/core/models/domain.model.ts'),
  ]);

  for (const formSource of [register, booking, event]) {
    assert.match(formSource, /routerLink="\/privacy"/);
    assert.match(formSource, /informativa privacy/i);
  }

  assert.match(domainModel, /privacyContactEmail:\s*string\s*\|\s*null/);
  assert.match(domainModel, /studioPrivacyContactEmail:\s*string\s*\|\s*null/);
  assert.match(booking, /studio\(\)!\.privacyContactEmail/);
  assert.match(event, /event\(\)!\.studioName/);
  assert.match(event, /event\(\)!\.studioPrivacyContactEmail/);
});

test('the marketing and authentication pages expose the privacy notice', async () => {
  const [home, login] = await Promise.all([
    source('src/app/features/home/home.component.ts'),
    source('src/app/features/login/login.component.ts'),
  ]);

  assert.match(home, /routerLink="\/privacy"/);
  assert.match(login, /routerLink="\/privacy"/);
});

test('the privacy table of contents keeps anchor navigation on the privacy route', async () => {
  const [privacyTemplate, appConfig] = await Promise.all([
    source('src/app/features/privacy/privacy.component.html'),
    source('src/app/app.config.ts'),
  ]);

  assert.doesNotMatch(privacyTemplate, /href="#[^"]+"/);
  assert.match(privacyTemplate, /routerLink="\/privacy" fragment="titolare"/);
  assert.match(privacyTemplate, /routerLink="\/privacy" fragment="diritti"/);
  assert.match(appConfig, /withInMemoryScrolling/);
  assert.match(appConfig, /anchorScrolling:\s*'enabled'/);
});

test('the privacy page bypasses its header for keyboard users', async () => {
  const privacyTemplate = await source('src/app/features/privacy/privacy.component.html');

  assert.match(privacyTemplate, /href="\/privacy#contenuto"/);
  assert.match(privacyTemplate, /<main[^>]+id="contenuto"[^>]+tabindex="-1"/);
});

test('the application does not disclose visitors to a remote font provider', async () => {
  const index = await source('src/index.html');

  assert.doesNotMatch(index, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});

test('the privacy notice describes storage of unrecognized WhatsApp payloads', async () => {
  const privacyTemplate = await source('src/app/features/privacy/privacy.component.html');

  assert.match(privacyTemplate, /quarantena/i);
  assert.match(privacyTemplate, /mittenti non riconosciuti/i);
  assert.match(privacyTemplate, /payload tecnico/i);
});
