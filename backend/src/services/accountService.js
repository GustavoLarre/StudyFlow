import {
  deleteSubjectsOfUser, deleteCardsOfUser, deleteNotesOfUser,
  deleteTasksOfUser, deleteUsernameDoc, deleteUserDoc
} from '../repositories/accountRepository.js';
import { getUserByUidDb } from '../repositories/userRepository.js';

export async function deleteAccount(uid, { deleteAuthUser }) {
  const user = await getUserByUidDb(uid);

  await deleteSubjectsOfUser(uid);
  await deleteCardsOfUser(uid);
  await deleteNotesOfUser(uid);
  await deleteTasksOfUser(uid);
  if (user?.username) await deleteUsernameDoc(user.username);
  await deleteUserDoc(uid);

  await deleteAuthUser(uid);
}