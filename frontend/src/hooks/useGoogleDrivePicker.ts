'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const GAPI_SRC = 'https://apis.google.com/js/api.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export interface DrivePickedFile {
  id: string;
  name: string;
  mimeType: string;
}

export interface DrivePickerError {
  code: 'not_configured' | 'script_load_failed' | 'token_denied' | 'picker_failed';
  message: string;
  details?: string;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve();
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export function useGoogleDrivePicker() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const tokenClientRef = useRef<any>(null);
  const accessTokenRef = useRef<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
  const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID || '';

  const configured = Boolean(clientId && apiKey);

  useEffect(() => {
    let cancelled = false;
    if (!configured) return;
    (async () => {
      try {
        await Promise.all([loadScript(GSI_SRC), loadScript(GAPI_SRC)]);
        await new Promise<void>((resolve) =>
          window.gapi.load('picker', { callback: () => resolve() })
        );
        if (cancelled) return;
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPE,
          callback: () => {
            // Real callback is set per-request in openPicker to avoid stale closures.
          },
        });
        setReady(true);
      } catch (err: any) {
        console.error('Google Drive picker init failed', err);
        setLoadError(err?.message || 'Failed to load Google scripts');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, clientId]);

  const openPicker = useCallback(
    (
      onPicked: (files: DrivePickedFile[]) => void,
      onError?: (err: DrivePickerError) => void
    ) => {
      if (!configured) {
        const err: DrivePickerError = {
          code: 'not_configured',
          message: 'Google Drive integration is not configured.',
          details:
            'Set NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY in frontend/.env.local and restart the dev server.',
        };
        if (onError) onError(err);
        else alert(`${err.message}\n${err.details}`);
        return;
      }
      if (loadError) {
        const err: DrivePickerError = {
          code: 'script_load_failed',
          message: 'Google scripts failed to load.',
          details: loadError,
        };
        if (onError) onError(err);
        else alert(`${err.message}\n${err.details}`);
        return;
      }
      if (!ready || !tokenClientRef.current) {
        const err: DrivePickerError = {
          code: 'script_load_failed',
          message: 'Google Drive is still loading. Please try again in a moment.',
        };
        if (onError) onError(err);
        return;
      }

      const showPicker = (token: string) => {
        try {
          const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
          view.setMimeTypes('application/pdf,text/csv,application/vnd.ms-excel');
          const builder = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(token)
            .setDeveloperKey(apiKey)
            .addView(view)
            .setCallback((data: any) => {
              if (data.action === window.google.picker.Action.PICKED) {
                const files: DrivePickedFile[] = (data.docs || []).map((d: any) => ({
                  id: d.id,
                  name: d.name,
                  mimeType: d.mimeType,
                }));
                onPicked(files);
              }
            });
          if (appId) builder.setAppId(appId);
          builder.build().setVisible(true);
        } catch (err: any) {
          console.error('Drive picker open failed', err);
          onError?.({
            code: 'picker_failed',
            message: 'Failed to open the Drive picker',
            details: err?.message,
          });
        }
      };

      // Reassign the token client callback every time so the picker opens on
      // the same click — avoids the "first click just grants token, second
      // click opens picker" bug.
      tokenClientRef.current.callback = (response: any) => {
        if (response?.error) {
          onError?.({
            code: 'token_denied',
            message: 'Google sign-in was declined',
            details: response.error,
          });
          return;
        }
        if (response?.access_token) {
          accessTokenRef.current = response.access_token;
          showPicker(response.access_token);
        }
      };

      if (accessTokenRef.current) {
        // Have a valid-ish token already — use it.
        showPicker(accessTokenRef.current);
      } else {
        tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
      }
    },
    [configured, ready, loadError, apiKey, appId]
  );

  const fetchPickedFiles = useCallback(
    async (picked: DrivePickedFile[]): Promise<File[]> => {
      const token = accessTokenRef.current;
      if (!token) return [];
      const out: File[] = [];
      for (const doc of picked) {
        try {
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) {
            console.warn(`Drive fetch ${doc.name} returned ${res.status}`);
            continue;
          }
          const blob = await res.blob();
          out.push(new File([blob], doc.name, { type: doc.mimeType || blob.type }));
        } catch (err) {
          console.error('Drive fetch failed for', doc.name, err);
        }
      }
      return out;
    },
    []
  );

  return { ready, configured, loadError, openPicker, fetchPickedFiles };
}
