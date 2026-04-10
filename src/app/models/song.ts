export interface Song {
  _id?: string;
  title: string;
  artist: string;
  album?: string;
  filePath?: string;
  image: string;
  audioUrl: string;
  createdAt?: string;
}
