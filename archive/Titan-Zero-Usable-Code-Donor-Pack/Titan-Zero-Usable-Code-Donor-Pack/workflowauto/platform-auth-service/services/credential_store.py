"""
Credential Store Service

Provides encrypted storage and retrieval of API credentials using SQLite database.
Implements Fernet encryption for sensitive credential data.
"""

import sqlite3
import aiosqlite
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)


class CredentialStore:
    """Encrypted credential storage using SQLite database."""
    
    def __init__(self, sqlite_path: str, encryption_key: str):
        """
        Initialize credential store.
        
        Args:
            sqlite_path: Path to SQLite database file
            encryption_key: Base64-encoded Fernet encryption key
        """
        self.sqlite_path = sqlite_path
        self.fernet = Fernet(encryption_key.encode())
        self.db: Optional[aiosqlite.Connection] = None
    
    async def initialize(self) -> None:
        """Initialize database connection and create tables."""
        try:
            self.db = await aiosqlite.connect(self.sqlite_path)
            await self._create_tables()
            logger.info(f"Credential store initialized with database: {self.sqlite_path}")
        except Exception as e:
            logger.error(f"Failed to initialize credential store: {e}")
            raise
    
    async def close(self) -> None:
        """Close database connection."""
        if self.db:
            await self.db.close()
            logger.info("Credential store database connection closed")
    
    async def _create_tables(self) -> None:
        """Create credentials table if it doesn't exist."""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT NOT NULL,
            connector_id TEXT NOT NULL,
            auth_type TEXT NOT NULL,
            encrypted_data BLOB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(workspace_id, connector_id)
        );
        """
        
        create_index_sql = """
        CREATE INDEX IF NOT EXISTS idx_workspace_connector 
        ON credentials(workspace_id, connector_id);
        """
        
        await self.db.execute(create_table_sql)
        await self.db.execute(create_index_sql)
        await self.db.commit()
        logger.debug("Database tables created/verified")
    
    def _encrypt_credential_data(self, credential_data: Dict[str, Any]) -> bytes:
        """
        Encrypt credential data.
        
        Args:
            credential_data: Raw credential data
            
        Returns:
            Encrypted credential data as bytes
        """
        json_data = json.dumps(credential_data, separators=(',', ':'))
        return self.fernet.encrypt(json_data.encode('utf-8'))
    
    def _decrypt_credential_data(self, encrypted_data: bytes) -> Dict[str, Any]:
        """
        Decrypt credential data.
        
        Args:
            encrypted_data: Encrypted credential data
            
        Returns:
            Decrypted credential data
        """
        decrypted_json = self.fernet.decrypt(encrypted_data).decode('utf-8')
        return json.loads(decrypted_json)
    
    async def store_credential(
        self,
        workspace_id: str,
        connector_id: str,
        auth_type: str,
        credential_data: Dict[str, Any]
    ) -> None:
        """
        Store encrypted credential data.
        
        Args:
            workspace_id: Workspace identifier
            connector_id: Connector identifier
            auth_type: Authentication type
            credential_data: Raw credential data to encrypt
        """
        if not self.db:
            raise RuntimeError("Database not initialized")
        
        encrypted_data = self._encrypt_credential_data(credential_data)
        
        # Use INSERT OR REPLACE to handle updates
        sql = """
        INSERT OR REPLACE INTO credentials 
        (workspace_id, connector_id, auth_type, encrypted_data, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """
        
        try:
            await self.db.execute(sql, (workspace_id, connector_id, auth_type, encrypted_data))
            await self.db.commit()
            
            logger.info(f"Stored credential for {workspace_id}/{connector_id}")
        except Exception as e:
            logger.error(f"Failed to store credential: {e}")
            raise
    
    async def get_credential(
        self,
        workspace_id: str,
        connector_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve and decrypt credential data.
        
        Args:
            workspace_id: Workspace identifier
            connector_id: Connector identifier
            
        Returns:
            Decrypted credential data or None if not found
        """
        if not self.db:
            raise RuntimeError("Database not initialized")
        
        sql = """
        SELECT auth_type, encrypted_data 
        FROM credentials 
        WHERE workspace_id = ? AND connector_id = ?
        """
        
        try:
            cursor = await self.db.execute(sql, (workspace_id, connector_id))
            row = await cursor.fetchone()
            
            if not row:
                logger.debug(f"No credential found for {workspace_id}/{connector_id}")
                return None
            
            auth_type, encrypted_data = row
            credential_data = self._decrypt_credential_data(encrypted_data)
            
            logger.debug(f"Retrieved credential for {workspace_id}/{connector_id}")
            
            return {
                "auth_type": auth_type,
                "credential_data": credential_data
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve credential: {e}")
            raise
    
    async def get_workspace_credentials(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        Get all credentials for a workspace (metadata only, no sensitive data).
        
        Args:
            workspace_id: Workspace identifier
            
        Returns:
            List of credential metadata
        """
        if not self.db:
            raise RuntimeError("Database not initialized")
        
        sql = """
        SELECT connector_id, auth_type, created_at, updated_at
        FROM credentials 
        WHERE workspace_id = ?
        ORDER BY connector_id
        """
        
        try:
            cursor = await self.db.execute(sql, (workspace_id,))
            rows = await cursor.fetchall()
            
            credentials = []
            for row in rows:
                connector_id, auth_type, created_at, updated_at = row
                credentials.append({
                    "connector_id": connector_id,
                    "auth_type": auth_type,
                    "created_at": created_at,
                    "updated_at": updated_at
                })
            
            logger.debug(f"Retrieved {len(credentials)} credentials for workspace {workspace_id}")
            return credentials
            
        except Exception as e:
            logger.error(f"Failed to retrieve workspace credentials: {e}")
            raise
    
    async def delete_credential(
        self,
        workspace_id: str,
        connector_id: str
    ) -> bool:
        """
        Delete stored credential.
        
        Args:
            workspace_id: Workspace identifier
            connector_id: Connector identifier
            
        Returns:
            True if credential was deleted, False if not found
        """
        if not self.db:
            raise RuntimeError("Database not initialized")
        
        sql = """
        DELETE FROM credentials 
        WHERE workspace_id = ? AND connector_id = ?
        """
        
        try:
            cursor = await self.db.execute(sql, (workspace_id, connector_id))
            await self.db.commit()
            
            deleted = cursor.rowcount > 0
            if deleted:
                logger.info(f"Deleted credential for {workspace_id}/{connector_id}")
            else:
                logger.debug(f"No credential found to delete for {workspace_id}/{connector_id}")
            
            return deleted
            
        except Exception as e:
            logger.error(f"Failed to delete credential: {e}")
            raise