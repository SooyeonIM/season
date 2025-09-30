import { Season, AxialTilt } from './types';

export const SEOUL_LATITUDE = 30;

export const MERIDIAN_ALTITUDES: { [key in AxialTilt]: { [key in Season]: number } } = {
  23.5: {
    [Season.Summer]: 90 - (SEOUL_LATITUDE - 23.5), // 83.5
    [Season.Winter]: 90 - (SEOUL_LATITUDE + 23.5), // 36.5
    [Season.Spring]: 90 - SEOUL_LATITUDE, // 60
    [Season.Autumn]: 90 - SEOUL_LATITUDE, // 60
  },
  0: {
    [Season.Summer]: 90 - SEOUL_LATITUDE, // 60
    [Season.Winter]: 90 - SEOUL_LATITUDE, // 60
    [Season.Spring]: 90 - SEOUL_LATITUDE, // 60
    [Season.Autumn]: 90 - SEOUL_LATITUDE, // 60
  },
};

export const SEASON_DATA: { [key in Season]: { name: string; angle: number; description: string } } = {
  [Season.Winter]: {
    name: '겨울 (동지)',
    angle: 0,
    description: '겨울에는 태양이 낮게 떠서 낮이 짧고 가장 추워요.',
  },
  [Season.Spring]: {
    name: '봄 (춘분)',
    angle: 90,
    description: '봄에는 태양의 높이가 중간 정도예요. 낮과 밤의 길이가 비슷해져요.',
  },
  [Season.Summer]: {
    name: '여름 (하지)',
    angle: 180,
    description: '여름에는 태양이 하늘 높이 떠서 낮이 길고 가장 더워요.',
  },
  [Season.Autumn]: {
    name: '가을 (추분)',
    angle: 270,
    description: '가을은 봄과 비슷하게 태양의 높이가 중간이고, 날씨가 선선해져요.',
  },
};

export const TILT_EXPLANATIONS: { [key in AxialTilt]: string } = {
    0: "자전축이 기울어지지 않으면 1년 내내 태양의 높이 변화가 거의 없어서 계절 변화도 없어요.",
    23.5: "자전축이 23.5도 기울어져 있어서, 공전 위치에 따라 태양의 높이가 달라지고 계절이 생겨요."
}