import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileText, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface GoogleDrivePickerButtonProps {
  type: 'document' | 'folder';
  onSelect: (file: { id: string; name: string }) => void;
  label?: string;
  onPickerOpen?: () => void;
  onPickerClose?: () => void;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export const GoogleDrivePickerButton: React.FC<GoogleDrivePickerButtonProps> = ({
  type,
  onSelect,
  label,
  onPickerOpen,
  onPickerClose,
}) => {
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  // Google API credentials from environment
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID || '';

  useEffect(() => {
    // Load Google Picker API
    const loadPicker = () => {
      if (window.google && window.google.picker) {
        setPickerApiLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          setPickerApiLoaded(true);
        });
      };
      document.body.appendChild(script);
    };

    loadPicker();
  }, []);

  const handleOpenPicker = async () => {
    if (!pickerApiLoaded) {
      alert('Google Picker is still loading. Please try again in a moment.');
      return;
    }

    if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
      alert('Google API credentials are not configured. Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID to your .env file.');
      return;
    }

    setIsLoading(true);

    try {
      // Create OAuth token client with implicit flow (popup mode)
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        // Use implicit flow to avoid page redirect
        ux_mode: 'popup',
        callback: (response: any) => {

          if (response.error) {
            console.error('OAuth error:', response);
            setIsLoading(false);
            alert('Failed to authenticate with Google Drive: ' + response.error);
            return;
          }

          if (response.access_token) {
            // Don't set loading to false yet - picker will handle it
            createPicker(response.access_token);
          } else {
            console.error('No access token in response:', response);
            setIsLoading(false);
            alert('Failed to authenticate with Google Drive');
          }
        },
      });

      // Request access token with no prompt for already authorized users
      tokenClient.requestAccessToken({
        prompt: 'consent',  // Always show consent to avoid issues
      });
    } catch (error) {
      console.error('Error opening picker:', error);
      setIsLoading(false);
      alert('Failed to open Google Drive picker. See console for details.');
    }
  };

  const createPicker = (accessToken: string) => {
    const google = window.google;

    let view;
    if (type === 'folder') {
      // Simple folder view
      view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
        .setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder');
    } else {
      // Simple document view - shows all Google Docs
      view = new google.picker.DocsView()
        .setMimeTypes('application/vnd.google-apps.document');
    }

    try {
      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setAppId(GOOGLE_APP_ID || 'default')
        .setCallback((data: any) => {

          if (data.action === google.picker.Action.PICKED) {
            const file = data.docs[0];
            setIsLoading(false);
            onPickerClose?.();
            onSelect({
              id: file.id,
              name: file.name,
            });
          } else if (data.action === google.picker.Action.CANCEL) {
            setIsLoading(false);
            onPickerClose?.();
          } else if (data.action === google.picker.Action.LOADED) {
            setIsLoading(false);
            onPickerOpen?.();
          }
        })
        .build();

      picker.setVisible(true);
    } catch (error) {
      console.error('Error building/showing picker:', error);
      setIsLoading(false);
      onPickerClose?.();
      alert('Failed to show picker: ' + error);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleOpenPicker}
      disabled={!pickerApiLoaded || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : type === 'folder' ? (
        <FolderOpen className="h-4 w-4 mr-2" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {label || (type === 'folder' ? 'Browse Folders' : 'Browse Documents')}
    </Button>
  );
};
