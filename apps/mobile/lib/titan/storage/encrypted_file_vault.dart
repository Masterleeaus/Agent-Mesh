import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:cryptography/cryptography.dart';
import 'package:path_provider/path_provider.dart';
import 'secure_store.dart';

class TitanEncryptedFileVault {
  final String scopeKey;
  final TitanSecureStore secureStore;
  final AesGcm algorithm;
  final Directory? rootDirectory;

  TitanEncryptedFileVault({
    required this.scopeKey,
    TitanSecureStore? secureStore,
    AesGcm? algorithm,
    this.rootDirectory,
  }):secureStore=secureStore??const TitanSecureStore(),
     algorithm=algorithm??AesGcm.with256bits();

  String get _keyLogical=>'evidence.file.key.v1::$scopeKey';

  Future<SecretKey> _key({required bool create}) async{
    final encoded=await secureStore.read(_keyLogical);
    if(encoded!=null&&encoded.isNotEmpty){
      return SecretKey(base64Url.decode(encoded));
    }
    if(!create){
      throw StateError('encrypted evidence key is unavailable');
    }
    final key=await algorithm.newSecretKey();
    final bytes=await key.extractBytes();
    await secureStore.write(_keyLogical,base64Url.encode(bytes));
    return key;
  }

  Future<Directory> _directory() async{
    final root=rootDirectory??await getApplicationSupportDirectory();
    final digest=await Sha256().hash(utf8.encode(scopeKey));
    final token=base64Url.encode(digest.bytes).replaceAll('=','');
    final dir=Directory('${root.path}/titan_secure_evidence/$token');
    if(!await dir.exists())await dir.create(recursive:true);
    return dir;
  }

  Future<String> writeBytes({
    required List<int> bytes,
    required String objectId,
  }) async{
    final dir=await _directory();
    final digest=await Sha256().hash(utf8.encode(objectId));
    final token=base64Url.encode(digest.bytes).replaceAll('=','');
    final aad=utf8.encode('$scopeKey::$token');
    final nonce=algorithm.newNonce();
    final box=await algorithm.encrypt(
      bytes,
      secretKey:await _key(create:true),
      nonce:nonce,
      aad:aad,
    );
    final envelope=<String,dynamic>{
      'v':1,
      'nonce':base64Encode(box.nonce),
      'mac':base64Encode(box.mac.bytes),
      'ciphertext':base64Encode(box.cipherText),
    };
    final target=File('${dir.path}/$token.tze');
    final temp=File('${target.path}.tmp');
    final backup=File('${target.path}.bak');
    if(await temp.exists())await temp.delete();
    if(await backup.exists())await backup.delete();
    await temp.writeAsString(jsonEncode(envelope),flush:true);
    if(await target.exists())await target.rename(backup.path);
    try{
      await temp.rename(target.path);
      if(await backup.exists())await backup.delete();
    }catch(_){
      if(await target.exists())await target.delete();
      if(await backup.exists())await backup.rename(target.path);
      rethrow;
    }
    return target.path;
  }

  Future<String> encryptedPathForObject(String objectId) async{
    final dir=await _directory();
    final digest=await Sha256().hash(utf8.encode(objectId));
    final token=base64Url.encode(digest.bytes).replaceAll('=','');
    return '${dir.path}/$token.tze';
  }

  Future<Uint8List> readObject(String objectId) async=>
      readDecrypted(await encryptedPathForObject(objectId));

  Future<void> deleteObject(String objectId) async=>
      delete(await encryptedPathForObject(objectId));

  Future<String> importFile({
    required String sourcePath,
    required String evidenceId,
  }) async{
    final source=File(sourcePath);
    final bytes=await source.readAsBytes();
    return writeBytes(bytes:bytes,objectId:evidenceId);
  }

  Future<Uint8List> readDecrypted(String encryptedPath) async{
    final raw=await File(encryptedPath).readAsString();
    final envelope=Map<String,dynamic>.from(jsonDecode(raw) as Map);
    if(envelope['v']!=1){
      throw StateError('unsupported evidence vault version');
    }
    final box=SecretBox(
      base64Decode(envelope['ciphertext'].toString()),
      nonce:base64Decode(envelope['nonce'].toString()),
      mac:Mac(base64Decode(envelope['mac'].toString())),
    );
    final filename=File(encryptedPath).uri.pathSegments.last;
    final token=filename.endsWith('.tze')
        ? filename.substring(0,filename.length-4)
        : filename;
    final clear=await algorithm.decrypt(
      box,
      secretKey:await _key(create:false),
      aad:utf8.encode('$scopeKey::$token'),
    );
    return Uint8List.fromList(clear);
  }

  Future<void> delete(String encryptedPath) async{
    final file=File(encryptedPath);
    if(await file.exists())await file.delete();
  }
}
