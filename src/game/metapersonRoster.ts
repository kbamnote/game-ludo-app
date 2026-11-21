import { CREW, DEFAULT_CHARACTER_MODEL, VARSITY, type Character } from './character'

/** Stable multiplayer IDs are SHA-256 digests of the original exports from characters/. */
export const METAPERSON_ROSTER = [
  { label: 'Habibi', id: '99ad15502cde62c87edfcd789adb971c401c3315927e3e7edba5dfa47582c13c', asset: require('../../assets/models/metaperson/avatar-00.glb') },
  { label: 'Imran Hashmin', id: '68eee406e31ac10cf1d555858a3710fe55097b25a67a2fd9c7b38eb73558ef5b', asset: require('../../assets/models/metaperson/avatar-01.glb') },
  { label: 'MetaPerson 02', id: '85feac7493d0e8b399c019a8b394d3e66ee3c14a28277fe21a2e1dfef6035526', asset: require('../../assets/models/metaperson/avatar-02.glb') },
  { label: 'Kiara', id: '0d8ccdba1403769215c86b328e034a62307c9a9463135f05e6b24bb1a9e2ca3d', asset: require('../../assets/models/metaperson/avatar-03.glb') },
  { label: 'Alia', id: '91fcf44779fc7cc11e2f6b52fd8b3c1154d30cf868c70b3be06278e5fb43fdc2', asset: require('../../assets/models/metaperson/avatar-04.glb') },
  { label: 'Modi Ji', id: 'dc672b725fbf61d970e36c5be6a4bd92810750235ea00951d3e75ba6f5033afc', asset: require('../../assets/models/metaperson/avatar-05.glb') },
  { label: 'Puneet superstar', id: 'f378431dfff60d56c59326444be1f5821c20c87ae253107dd34830a296258b98', asset: require('../../assets/models/metaperson/avatar-06.glb') },
  { label: 'Aishwarya', id: '30c6fae57e4052989eac9a0ddb7b3235dde409d14b5e88465ffb8ebf1844b2ae', asset: require('../../assets/models/metaperson/avatar-09.glb') },
  { label: 'Anuu', id: 'a48e85cab93b8cb2f5c8d8d8c818fba2b037e933755ef166a854741a38b132fe', asset: require('../../assets/models/metaperson/avatar-10.glb') },
  { label: 'Rahul Gandhi', id: 'ed2714d6f65673a1234bff7fdb174e024fc0e464614ced15fff3b1361aa0449a', asset: require('../../assets/models/metaperson/avatar-11.glb') },
] as const

export function bundledMetaPerson(id?: string) {
  return METAPERSON_ROSTER.find(avatar => avatar.id === id)
}
export function characterName(character: Character) {
  if (character.avatarId) return bundledMetaPerson(character.avatarId)?.label ?? 'My avatar'
  if (character.model === VARSITY) return character.face ? 'My avatar' : CREW[DEFAULT_CHARACTER_MODEL]
  return CREW[character.model]
}
