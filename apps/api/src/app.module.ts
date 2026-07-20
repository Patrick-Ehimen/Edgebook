import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { ArchiveModule } from './archive/archive.module';
import { AuthModule } from './auth/auth.module';
import { EncryptionModule } from './encryption/encryption.module';
import { JournalModule } from './journal/journal.module';
import { NotesModule } from './notes/notes.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { PositionsModule } from './positions/positions.module';
import { PrismaModule } from './prisma/prisma.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    AuthModule,
    AccountsModule,
    PositionsModule,
    PlaybooksModule,
    NotesModule,
    JournalModule,
    WatchlistModule,
    ArchiveModule,
  ],
})
export class AppModule {}
