export interface DefaultsConfig {
  acceptedExtensions: string[]
  language: string
  tagsFile: string
  tagUsageFile: string
  lastProjectNumber: string
  tagPanelVisible: boolean
  toolbarStyle: string
  defaultSaveDirectory: string
  defaultImportDirectory: string
  compressionMaxSizeKb: number
  compressionQuality: number
  compressionReduceResolution: boolean
  compressionResizeOnly: boolean
  compressionMaxWidth: number
  compressionMaxHeight: number
  compressAfterRename: boolean
}

export const defaults: DefaultsConfig = {
  acceptedExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.heic',
    '.mp4', '.avi', '.mov', '.mkv'
  ],
  language: 'en',
  tagsFile: 'tags.json',
  tagUsageFile: 'tag_usage.json',
  lastProjectNumber: '',
  tagPanelVisible: false,
  toolbarStyle: 'icons',
  defaultSaveDirectory: '',
  defaultImportDirectory: '',
  compressionMaxSizeKb: 2500,
  compressionQuality: 99,
  compressionReduceResolution: true,
  compressionResizeOnly: false,
  compressionMaxWidth: 1440,
  compressionMaxHeight: 1440,
  compressAfterRename: false,
}