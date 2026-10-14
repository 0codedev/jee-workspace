
import { UserIntent, IPersona } from './types';
import { CoachPersona } from './personas/Coach';
import { TutorPersona } from './personas/Tutor';
import { TherapistPersona } from './personas/Therapist';
import { GeneralistPersona } from './personas/Generalist';
import { PersonaLockMode } from '../../types';

export const getPersona = (intent: UserIntent, personaLock?: PersonaLockMode): IPersona => {
  if (personaLock && personaLock !== 'auto') {
    switch (personaLock) {
      case 'coach':
      case 'strategist':
        return new CoachPersona();
      case 'tutor':
      case 'feynman':
        return new TutorPersona();
      case 'therapist':
        return new TherapistPersona();
      default:
        break;
    }
  }

  switch (intent) {
    case 'ANALYSIS':
    case 'PLANNING': // Coach handles planning too for now
      return new CoachPersona();
    case 'CONCEPT':
      return new TutorPersona();
    case 'EMOTIONAL':
      return new TherapistPersona();
    case 'GENERAL':
    default:
      return new GeneralistPersona();
  }
};