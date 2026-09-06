import { Interaction } from '../types';

/**
 * Formats a MindScribe interaction into rich calligraphic HTML suitable for Google Docs
 */
export function formatInteractionForGoogleDocs(interaction: Interaction, penName?: string): string {
  const dateStr = new Date(interaction.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = new Date(interaction.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const locationSnippet = interaction.location
    ? `<p style="color: #8C857B; font-size: 11pt; font-family: 'Georgia', serif; margin-top: 4pt;">📍 <i>${interaction.location.name}${
        interaction.location.weather ? ` (${interaction.location.weather.tempC}°C, ${interaction.location.weather.condition})` : ''
      }</i></p>`
    : '';

  const messagesHtml = (interaction.messages || [])
    .map((msg, idx) => {
      const isUser = msg.role === 'user';
      const roleLabel = isUser ? (penName || 'Author Reflection') : 'Socratic Interlocutor';
      const headerColor = isUser ? '#C4432B' : '#4A4641';
      const bgColor = isUser ? '#FCFAF7' : '#F7F5F0';
      const borderColor = isUser ? '#C4432B' : '#E2DDD5';

      return `
        <div style="margin-top: 18pt; margin-bottom: 18pt; padding: 16pt; background-color: ${bgColor}; border-left: 4pt solid ${borderColor}; border-radius: 6pt;">
          <p style="font-family: 'Arial', sans-serif; font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; color: ${headerColor}; margin-bottom: 8pt;">
            #${idx + 1} · ${roleLabel} <span style="font-weight: normal; color: #8C857B; font-size: 8pt;">(${msg.timestamp})</span>
          </p>
          <div style="font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.65; color: #2B2A28;">
            ${msg.content.replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
    })
    .join('');

  const cognitiveLensHtml = interaction.cognitiveAnalysis
    ? `
      <div style="margin-top: 24pt; padding: 16pt; background-color: #FFFDF9; border: 1pt solid #E2DDD5; border-radius: 6pt;">
        <h3 style="font-family: 'Georgia', serif; font-size: 14pt; color: #C4432B; margin-bottom: 8pt;">🧠 Cognitive Clarity & Insights</h3>
        <p style="font-family: 'Georgia', serif; font-size: 11pt; line-height: 1.6; color: #2B2A28; font-style: italic;">
          "${interaction.cognitiveAnalysis.coreAxiom || ''}"
        </p>
        ${interaction.cognitiveAnalysis.cognitiveBlindspots?.length ? `
          <h4 style="font-family: 'Georgia', serif; font-size: 11pt; color: #7A746B; margin-top: 10pt; margin-bottom: 4pt;">Helpful Reframes:</h4>
          <ul style="font-family: 'Georgia', serif; font-size: 10.5pt; line-height: 1.5; color: #403D39;">
            ${interaction.cognitiveAnalysis.cognitiveBlindspots.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${interaction.title || 'MindScribe Sanctuary Reflection'}</title>
</head>
<body style="font-family: 'Georgia', serif; margin: 40pt; color: #2B2A28; background-color: #FFFFFF;">
  <div style="border-bottom: 2pt solid #C4432B; padding-bottom: 14pt; margin-bottom: 20pt;">
    <span style="font-family: 'Arial', sans-serif; font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; color: #C4432B;">
      MindScribe Philosophical Journal
    </span>
    <h1 style="font-size: 26pt; font-weight: normal; margin-top: 6pt; margin-bottom: 6pt; color: #1A1918;">
      ${interaction.title || 'Untitled Inquiry'}
    </h1>
    <p style="color: #595652; font-size: 11pt; font-family: 'Georgia', serif; margin: 0;">
      ${dateStr} at ${timeStr} · Category: <b style="text-transform: capitalize;">${interaction.category || 'Reflection'}</b>
    </p>
    ${locationSnippet}
  </div>

  <div>
    ${messagesHtml}
  </div>

  ${cognitiveLensHtml}

  <footer style="margin-top: 40pt; border-top: 1pt solid #E5E0D8; padding-top: 12pt; font-family: 'Arial', sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.2em; color: #8C857B; text-align: center;">
    MindScribe Sanctuary Archive · Zero-Knowledge Private Ledger
  </footer>
</body>
</html>
  `.trim();
}

/**
 * 1-Click Export to Google Docs:
 * Copies rich calligraphic HTML to system clipboard and opens Google Docs new document creator.
 * When the user pastes in Google Docs (Ctrl+V / Cmd+V), all typography, colors, quotes, and borders format instantly!
 */
export async function exportToGoogleDocs(interaction: Interaction, penName?: string): Promise<{ success: boolean; url: string }> {
  const htmlContent = formatInteractionForGoogleDocs(interaction, penName);
  const plainText = `${interaction.title || 'MindScribe Reflection'}\n${new Date(interaction.createdAt).toLocaleDateString()}\n\n` +
    (interaction.messages || []).map((m) => `${m.role.toUpperCase()}:\n${m.content}\n`).join('\n');

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }
  } catch (err) {
    console.warn('Clipboard write fallback:', err);
  }

  // Open Google Docs Document Creator
  const googleDocsUrl = 'https://docs.google.com/document/create';
  window.open(googleDocsUrl, '_blank', 'noopener,noreferrer');

  return { success: true, url: googleDocsUrl };
}

/**
 * Downloads a styled HTML file ready to be dragged or uploaded to Google Drive
 */
export function downloadGoogleDriveFile(interaction: Interaction, penName?: string): void {
  const htmlContent = formatInteractionForGoogleDocs(interaction, penName);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (interaction.title || 'reflection').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const dateStr = new Date(interaction.createdAt).toISOString().split('T')[0];
  link.href = url;
  link.download = `${dateStr}_${safeTitle}_google_docs.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
