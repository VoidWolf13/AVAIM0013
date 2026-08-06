import React from 'react';
import { ARTIST_NAME, ARTIST_EMAIL, GITHUB_REPO_URL, GITHUB_PAGES_URL } from '../data/tracks';
import { useAudio } from '../context/AudioContext';
import { Github, Mail, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const { tracks } = useAudio();

  return (
    <footer className="w-full border-t border-neutral-900 bg-black py-6 mt-8 text-neutral-500 font-mono text-xs">
      <div className="max-w-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <span className="text-neutral-300 font-semibold">{ARTIST_NAME}</span>
          <span className="mx-1.5">•</span>
          <span>{tracks.length} tracks</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
          <a
            href={GITHUB_PAGES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Mirror</span>
          </a>
          <a
            href={`mailto:${ARTIST_EMAIL}`}
            className="hover:text-neutral-300 transition flex items-center gap-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

